const Product = require("../models/Product");
const Material = require("../models/Material");
const FurnitureModule = require("../models/FurnitureModule");
const ApiResponse = require("../utils/apiResponse");

/**
 * Fiyat hesaplama formülü:
 * 1. Alan fiyatı : basePrice × (width × height) / 10000  [cm → m²]
 *    Karyola kategorisinde yükseklik fiyatı etkilemez (sadece min/max ile
 *    sınırlanır) — alan fiyatı bunun yerine width × depth üzerinden hesaplanır.
 * 2. Derinlik ek : depth ≤ 60 cm → +0%; her 10 cm dilimi için +%10
 *    depthBrackets = Math.ceil((depth - 60) / 10)  (min 0)
 *    depthMultiplier = 1 + depthBrackets × 0.10
 *    Karyolada depth zaten alan fiyatının bir parçası olduğundan bu ek ücret
 *    uygulanmaz (aksi halde aynı boyut hem alanda hem surcharge'da sayılırdı).
 * 3. Malzeme ve renk modifier'ları yüzde artış olarak uygulanır
 *    finalPrice = alanFiyatı × depthMultiplier × (1 + matMod/100) × (1 + colorMod/100)
 *                 + modüllerToplamı
 * 4. Modüller (çekmece/kapak/raf vb.) sabit birim fiyatlıdır — alan/derinlik/malzeme
 *    çarpanlarından etkilenmez, her biri kendi priceModifier'ı × adet kadar toplama eklenir.
 */
const calculatePrice = async (req, res) => {
  const { productId, width, height, depth, materialId, colorId, modules } = req.body;

  if (!productId || !width || !height || !depth) {
    return ApiResponse.error(
      res,
      "productId, width, height ve depth zorunludur",
      400
    );
  }

  const product = await Product.findById(productId).populate("category");
  if (!product) {
    return ApiResponse.error(res, "Ürün bulunamadı", 404);
  }

  const isBed = product.category?.slug === "karyola";

  // Boyut sınır kontrolü
  const checks = [
    [width, product.dimensions?.minWidth, product.dimensions?.maxWidth, "Genişlik"],
    [height, product.dimensions?.minHeight, product.dimensions?.maxHeight, "Yükseklik"],
    [depth, product.dimensions?.minDepth, product.dimensions?.maxDepth, "Derinlik"],
  ];

  for (const [val, min, max, label] of checks) {
    if (min != null && val < min) {
      return ApiResponse.error(
        res,
        `${label} minimum değerin (${min}) altında`,
        400
      );
    }
    if (max != null && val > max) {
      return ApiResponse.error(
        res,
        `${label} maksimum değeri (${max}) aşıyor`,
        400
      );
    }
  }

  // Genişlik, yükseklik ve derinlik minimum 100 cm — altındaysa 100'e yuvarla
  const effectiveWidth = width < 100 ? 100 : width;
  const effectiveHeight = height < 100 ? 100 : height;
  const effectiveDepth = depth < 100 ? 100 : depth;

  // Alan bazlı baz fiyat (cm² → m²) — karyolada yükseklik yerine derinlik kullanılır
  const areaSqm = isBed
    ? (effectiveWidth * effectiveDepth) / 10000
    : (effectiveWidth * effectiveHeight) / 10000;
  let price = (product.basePrice || 0) * areaSqm;

  // Derinlik ek ücreti: 60 cm'ye kadar etkisiz, sonrasında her 10 cm dilimi +%10
  // Karyolada derinlik zaten alan fiyatına dahil edildiğinden bu ek ücret uygulanmaz.
  const depthBrackets = !isBed && depth > 60 ? Math.ceil((depth - 60) / 10) : 0;
  const depthMultiplier = 1 + depthBrackets * 0.1;
  price = price * depthMultiplier;

  let materialModifier = 0;
  let colorModifier = 0;
  let appliedMaterial = null;
  let appliedColor = null;

  if (materialId) {
    // Malzemenin bu ürüne atanmış olup olmadığını kontrol et
    const isAllowed = product.allowedMaterials.some(
      (id) => id.toString() === materialId
    );
    if (!isAllowed) {
      return ApiResponse.error(
        res,
        "Bu malzeme söz konusu ürün için geçerli değil",
        400
      );
    }

    const material = await Material.findById(materialId);
    if (!material) {
      return ApiResponse.error(res, "Malzeme bulunamadı", 404);
    }

    materialModifier = material.priceModifier || 0;
    appliedMaterial = { id: material._id, name: material.name, modifier: materialModifier };

    if (colorId) {
      const color = material.colors.find((c) => c._id.toString() === colorId);
      if (!color) {
        return ApiResponse.error(
          res,
          "Renk bu malzeme içinde bulunamadı",
          404
        );
      }
      colorModifier = color.priceModifier || 0;
      appliedColor = { id: color._id, name: color.name, modifier: colorModifier };
    }
  }

  // Modüller (çekmece vb.): { moduleId, quantity }[] — her modül kendi priceModifier'ı
  // × adet kadar toplama sabit bir ek ücret olarak eklenir (alan/malzeme çarpanlarından
  // etkilenmez), böylece her çekmece eklendiğinde fiyat o çekmece modülünün birim
  // fiyatı kadar artar.
  let modulesTotal = 0;
  const appliedModules = [];

  if (modules !== undefined) {
    if (!Array.isArray(modules)) {
      return ApiResponse.error(res, "modules bir dizi olmalıdır", 400);
    }

    const moduleIds = modules.map((m) => m?.moduleId).filter(Boolean);
    const foundModules = await FurnitureModule.find({
      _id: { $in: moduleIds },
      isActive: true,
    });
    const moduleById = new Map(foundModules.map((m) => [m._id.toString(), m]));

    for (const entry of modules) {
      const quantity = Number(entry?.quantity) || 0;
      if (quantity <= 0) continue;

      const mod = moduleById.get(String(entry?.moduleId));
      if (!mod) {
        return ApiResponse.error(res, "Geçersiz modül", 400);
      }

      const lineTotal = mod.priceModifier * quantity;
      modulesTotal += lineTotal;
      appliedModules.push({
        id: mod._id,
        name: mod.name,
        slug: mod.slug,
        quantity,
        unitPrice: mod.priceModifier,
        lineTotal,
      });
    }
  }

  const finalPrice =
    price * (1 + materialModifier / 100) * (1 + colorModifier / 100) +
    modulesTotal;

  return ApiResponse.success(res, {
    product: { id: product._id, name: product.name },
    dimensions: { width, height, depth },
    effectiveDimensions: { width: effectiveWidth, height: effectiveHeight, depth: effectiveDepth },
    basePrice: product.basePrice,
    areaSqm: Math.round(areaSqm * 10000) / 10000,
    areaPrice: Math.round((product.basePrice || 0) * areaSqm * 100) / 100,
    depth: {
      brackets: depthBrackets,
      surchargePercent: depthBrackets * 10,
      multiplier: depthMultiplier,
    },
    dimensionPrice: Math.round(price * 100) / 100,
    material: appliedMaterial,
    color: appliedColor,
    modules: appliedModules,
    modulesTotal: Math.round(modulesTotal * 100) / 100,
    finalPrice: Math.round(finalPrice * 100) / 100,
    currency: "TRY",
  });
};

module.exports = { calculatePrice };

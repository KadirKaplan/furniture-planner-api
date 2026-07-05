const Product = require("../models/Product");
const Material = require("../models/Material");
const ApiResponse = require("../utils/apiResponse");

/**
 * Fiyat hesaplama formülü:
 * 1. Alan fiyatı : basePrice × (width × height) / 10000  [cm → m²]
 * 2. Derinlik ek : depth ≤ 60 cm → +0%; her 10 cm dilimi için +%10
 *    depthBrackets = Math.ceil((depth - 60) / 10)  (min 0)
 *    depthMultiplier = 1 + depthBrackets × 0.10
 * 3. Malzeme ve renk modifier'ları yüzde artış olarak uygulanır
 *    finalPrice = alanFiyatı × depthMultiplier × (1 + matMod/100) × (1 + colorMod/100)
 */
const calculatePrice = async (req, res) => {
  const { productId, width, height, depth, materialId, colorId } = req.body;

  if (!productId || !width || !height || !depth) {
    return ApiResponse.error(
      res,
      "productId, width, height ve depth zorunludur",
      400
    );
  }

  const product = await Product.findById(productId);
  if (!product) {
    return ApiResponse.error(res, "Ürün bulunamadı", 404);
  }

  // Boyut sınır kontrolü
  const checks = [
    [width, product.minWidth, product.maxWidth, "Genişlik"],
    [height, product.minHeight, product.maxHeight, "Yükseklik"],
    [depth, product.minDepth, product.maxDepth, "Derinlik"],
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

  // Genişlik ve yükseklik minimum 100 cm — altındaysa 100'e yuvarla
  const effectiveWidth = width < 100 ? 100 : width;
  const effectiveHeight = height < 100 ? 100 : height;

  // Alan bazlı baz fiyat (cm² → m²)
  const areaSqm = (effectiveWidth * effectiveHeight) / 10000;
  let price = (product.basePrice || 0) * areaSqm;

  // Derinlik ek ücreti: 60 cm'ye kadar etkisiz, sonrasında her 10 cm dilimi +%10
  const depthBrackets = depth > 60 ? Math.ceil((depth - 60) / 10) : 0;
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

  const finalPrice =
    price * (1 + materialModifier / 100) * (1 + colorModifier / 100);

  return ApiResponse.success(res, {
    product: { id: product._id, name: product.name },
    dimensions: { width, height, depth },
    effectiveDimensions: { width: effectiveWidth, height: effectiveHeight, depth },
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
    finalPrice: Math.round(finalPrice * 100) / 100,
    currency: "TRY",
  });
};

module.exports = { calculatePrice };

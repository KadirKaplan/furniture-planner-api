const Product = require("../models/Product");
const Material = require("../models/Material");
const FurnitureModule = require("../models/FurnitureModule");
const Setting = require("../models/Setting");

/**
 * Fiyat hesaplama çekirdeği. HTTP'den bağımsızdır (req/res bilmez) — hem
 * POST /pricing/calculate ucu hem de teklif isteği kaydı (quoteRequestController)
 * aynı formülü buradan çağırır. Teklifte fiyatın sunucuda YENİDEN hesaplanması
 * şart: aksi halde client'ın gönderdiği tutara güvenmek gerekirdi ve Network
 * sekmesinden düzenlenmiş bir istekle sahte fiyatlı teklif kaydı oluşturulabilirdi.
 *
 * Formül:
 * 1. Alan fiyatı : basePrice × (width × height) / 10000  [cm → m²]
 *    Karyola kategorisinde yükseklik fiyatı etkilemez (sadece min/max ile
 *    sınırlanır) — alan fiyatı bunun yerine width × depth üzerinden hesaplanır.
 * 2. Derinlik ek : depth ≤ 60 cm → +0%; her 10 cm dilimi için +%10
 *    depthBrackets = Math.ceil((depth - 60) / 10)  (min 0)
 *    depthMultiplier = 1 + depthBrackets × 0.10
 *    Karyolada depth zaten alan fiyatının bir parçası olduğundan bu ek ücret
 *    uygulanmaz (aksi halde aynı boyut hem alanda hem surcharge'da sayılırdı).
 * 3. Malzemenin fiyat etkisi ÜRÜN BAŞINA yönetilir (Material'de global modifier yok):
 *    ürünün materialBasePrices listesinde seçilen materyal için özel taban fiyat
 *    tanımlıysa alan fiyatı product.basePrice yerine o değerle hesaplanır; tanımlı
 *    değilse materyalin fiyata etkisi olmaz. Renk modifier'ı yüzde artış olarak uygulanır:
 *    finalPrice = alanFiyatı × depthMultiplier × (1 + colorMod/100) + modüllerToplamı
 * 4. Modüller (çekmece/kapak/raf vb.) sabit birim fiyatlıdır — alan/derinlik/malzeme
 *    çarpanlarından etkilenmez, her biri kendi priceModifier'ı × adet kadar toplama eklenir.
 *
 * @returns {{ ok: true, data: object } | { ok: false, message: string, status: number }}
 */
const computePrice = async (
  { productId, width, height, depth, materialId, colorId, modules },
  options = {}
) => {
  const fail = (message, status = 400) => ({ ok: false, message, status });

  if (!productId || !width || !height || !depth) {
    return fail("productId, width, height ve depth zorunludur");
  }

  const product = await Product.findById(productId).populate("category");
  if (!product) {
    return fail("Ürün bulunamadı", 404);
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
      return fail(`${label} minimum değerin (${min}) altında`);
    }
    if (max != null && val > max) {
      return fail(`${label} maksimum değeri (${max}) aşıyor`);
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

  // Derinlik ek ücreti: 60 cm'ye kadar etkisiz, sonrasında her 10 cm dilimi +%10
  // Karyolada derinlik zaten alan fiyatına dahil edildiğinden bu ek ücret uygulanmaz.
  const depthBrackets = !isBed && depth > 60 ? Math.ceil((depth - 60) / 10) : 0;
  const depthMultiplier = 1 + depthBrackets * 0.1;

  // Materyalin fiyat etkisi ürün başına yönetilir: ürünün materialBasePrices
  // listesinde seçilen materyal için özel bir taban fiyat varsa alan fiyatı onun
  // üzerinden hesaplanır (fiyat o ürün+materyal ikilisi için mutlak girilmiştir).
  // Tanımlı değilse materyalin fiyata etkisi yoktur — Material'de global bir
  // yüzde modifier alanı artık bulunmaz.
  let effectiveBasePrice = product.basePrice || 0;
  let colorModifier = 0;
  let appliedMaterial = null;
  let appliedColor = null;

  if (materialId) {
    // Malzemenin bu ürüne atanmış olup olmadığını kontrol et
    const isAllowed = product.allowedMaterials.some(
      (id) => id.toString() === materialId
    );
    if (!isAllowed) {
      return fail("Bu malzeme söz konusu ürün için geçerli değil");
    }

    const material = await Material.findById(materialId);
    if (!material) {
      return fail("Malzeme bulunamadı", 404);
    }

    const baseOverride = (product.materialBasePrices || []).find(
      (mp) => mp.material?.toString() === materialId && mp.basePrice > 0
    );

    if (baseOverride) {
      effectiveBasePrice = baseOverride.basePrice;
      appliedMaterial = {
        id: material._id,
        name: material.name,
        baseOverride: baseOverride.basePrice,
      };
    } else {
      appliedMaterial = { id: material._id, name: material.name };
    }

    if (colorId) {
      const color = material.colors.find((c) => c._id.toString() === colorId);
      if (!color) {
        return fail("Renk bu malzeme içinde bulunamadı", 404);
      }
      colorModifier = color.priceModifier || 0;
      appliedColor = { id: color._id, name: color.name, modifier: colorModifier };
    }
  }

  // Alan fiyatı, materyal çözümlemesinden SONRA hesaplanır — taban fiyat ürün+materyal
  // ikilisine göre değişebilir (materialBasePrices override'ı).
  const price = effectiveBasePrice * areaSqm * depthMultiplier;

  // Modüller (çekmece vb.): { moduleId, submoduleId?, quantity }[] — her modül kendi
  // priceModifier'ı × adet kadar toplama sabit bir ek ücret olarak eklenir (alan/malzeme
  // çarpanlarından etkilenmez), böylece her çekmece eklendiğinde fiyat o çekmece modülünün
  // birim fiyatı kadar artar.
  //
  // submoduleId verilmişse (ör. kapak stili): o satırın birim fiyatı, modülün kendi
  // priceModifier'ı YERİNE alt modülün priceModifier'ı olur — yani ana modülün taban
  // fiyatı (ör. Kapak: 450₺, ayrı bir satırla quantity=toplam kapı sayısı gönderilir)
  // ile seçilen stilin farkı (ör. Rustik Kapak: +150₺) birbirinden bağımsız iki satır
  // olarak toplanır (additive), biri diğerinin yerine geçmez.
  let modulesTotal = 0;
  const appliedModules = [];

  if (modules !== undefined) {
    if (!Array.isArray(modules)) {
      return fail("modules bir dizi olmalıdır");
    }

    const moduleIds = modules.map((m) => m?.moduleId).filter(Boolean);
    const foundModules = await FurnitureModule.find({
      _id: { $in: moduleIds },
      isActive: true,
    });
    const moduleById = new Map(foundModules.map((m) => [m._id.toString(), m]));

    // Hangi modül TİPİ hangi ürün kategorisinde kullanılabilir kuralı kod içinde sabit
    // tutulmuyor — DB'deki "moduleCategoryRules" Setting kaydından okunur (kategori slug
    // → modül tipi listesi; CMS'teki kural matrisi ekranından yönetilir).
    // Teklif isteğinde tek istekte çok sayıda ürün fiyatlandığından, çağıran taraf
    // kuralları bir kez okuyup options ile geçebilir (ürün başına sorgu atılmasın diye).
    const moduleCategoryRules =
      options.moduleCategoryRules ??
      (await Setting.findOne({ key: "moduleCategoryRules" }))?.value ??
      {};
    // FAIL-CLOSED: bu, teklif/fiyat hesabının GERÇEK doğrulama sınırı (bkz. FE'deki
    // aynı isimli yardımcı — orada kurallar henüz yüklenmemişken bilerek fail-open'dır
    // çünkü orası yalnızca UI'ı gizler/gösterir ve burası zaten yeniden doğrular).
    // categorySlug'ın eksik olması normalde olmaz ama ürünün category referansı
    // silinmiş bir kategoriye işaret ediyorsa (bkz. Category.deleteCategory) populate
    // null döner ve categorySlug undefined olur — bu durumda "kural yok say, izin ver"
    // demek, kural matrisini tamamen atlatan bir açık bırakırdı.
    const isModuleAllowedForCategory = (moduleType, categorySlug) => {
      if (!moduleType || !categorySlug) return false;
      return (moduleCategoryRules[categorySlug] ?? []).includes(moduleType);
    };

    for (const entry of modules) {
      const quantity = Number(entry?.quantity) || 0;
      if (quantity <= 0) continue;

      const mod = moduleById.get(String(entry?.moduleId));
      if (!mod) {
        return fail("Geçersiz modül");
      }

      // Kural eşleşmesi modülün DAVRANIŞ tipi (type enum) üzerinden yapılır — admin
      // CMS'te modüle istediği ismi/slug'ı verebilir, davranış sözleşmesini bozamaz.
      if (!isModuleAllowedForCategory(mod.type, product.category?.slug)) {
        return fail(`"${mod.name}" modülü bu ürün kategorisi için geçerli değil`);
      }

      let unitPrice = mod.priceModifier;
      let name = mod.name;
      let slug = mod.slug;

      if (entry?.submoduleId) {
        const submodule = mod.submodules?.id(entry.submoduleId);
        if (!submodule || !submodule.isActive) {
          return fail("Geçersiz alt modül");
        }
        unitPrice = submodule.priceModifier;
        name = `${mod.name} — ${submodule.name}`;
        slug = submodule.slug;
      }

      const lineTotal = unitPrice * quantity;
      modulesTotal += lineTotal;
      appliedModules.push({
        id: mod._id,
        name,
        slug,
        type: mod.type,
        quantity,
        unitPrice,
        lineTotal,
      });
    }
  }

  const finalPrice = price * (1 + colorModifier / 100) + modulesTotal;

  return {
    ok: true,
    data: {
      product: { id: product._id, name: product.name },
      categorySlug: product.category?.slug ?? null,
      dimensions: { width, height, depth },
      effectiveDimensions: {
        width: effectiveWidth,
        height: effectiveHeight,
        depth: effectiveDepth,
      },
      // Materyal override'ı varsa uygulanan taban fiyat ürünkinden farklıdır — burada
      // hesapta gerçekten kullanılan değer döner.
      basePrice: effectiveBasePrice,
      areaSqm: Math.round(areaSqm * 10000) / 10000,
      areaPrice: Math.round(effectiveBasePrice * areaSqm * 100) / 100,
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
    },
  };
};

/**
 * moduleCategoryRules'ı bir kez okur — çok ürünlü teklif hesabında computePrice'a
 * options olarak geçilir ki her ürün için ayrı Setting sorgusu atılmasın.
 */
const loadModuleCategoryRules = async () => {
  const setting = await Setting.findOne({ key: "moduleCategoryRules" });
  return setting?.value ?? {};
};

module.exports = { computePrice, loadModuleCategoryRules };

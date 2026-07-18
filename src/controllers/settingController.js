const Setting = require("../models/Setting");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../middleware/asyncHandler");
const Category = require("../models/Category");
const { MODULE_TYPES } = require("../config/moduleTypes");

exports.getSetting = asyncHandler(async (req, res) => {
  const setting = await Setting.findOne({ key: req.params.key });

  if (!setting) {
    return ApiResponse.error(res, "Ayar bulunamadı", 404);
  }

  return ApiResponse.success(res, setting.value);
});

// Yalnızca "moduleCategoryRules" güncellenebilir — genel amaçlı bir settings editörü
// bilinçli olarak açılmadı (keyfi key/value yazımı davranış sözleşmesini bozabilir).
// Kural matrisi iki kapalı kümeden oluştuğu için güvenle CMS'e açılabiliyor:
// anahtarlar mevcut kategori slug'ları, değerler MODULE_TYPES enum'undan tip listeleri.
const UPDATABLE_KEYS = new Set(["moduleCategoryRules"]);

exports.updateSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;

  if (!UPDATABLE_KEYS.has(key)) {
    return ApiResponse.error(res, "Bu ayar CMS üzerinden düzenlenemez", 403);
  }

  const value = req.body?.value;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return ApiResponse.error(res, "value bir nesne olmalıdır", 400);
  }

  // Anahtarlar gerçek kategori slug'ları olmalı — silinmiş/uydurma kategori kuralı yazılamaz
  const categories = await Category.find({}, "slug");
  const validCategorySlugs = new Set(categories.map((c) => c.slug));

  for (const [categorySlug, types] of Object.entries(value)) {
    if (!validCategorySlugs.has(categorySlug)) {
      return ApiResponse.error(res, `Geçersiz kategori: "${categorySlug}"`, 400);
    }
    if (!Array.isArray(types)) {
      return ApiResponse.error(res, `"${categorySlug}" için değer bir dizi olmalıdır`, 400);
    }
    for (const t of types) {
      if (!MODULE_TYPES.includes(t)) {
        return ApiResponse.error(res, `Geçersiz modül tipi: "${t}"`, 400);
      }
    }
  }

  const setting = await Setting.findOneAndUpdate(
    { key },
    { value },
    { new: true, upsert: true }
  );

  return ApiResponse.success(res, setting.value, "Ayar güncellendi");
});

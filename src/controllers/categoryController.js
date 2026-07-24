const Category = require("../models/Category");
const Product = require("../models/Product");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../middleware/asyncHandler");

exports.getCategories = asyncHandler(async (req, res) => {
  const query = {};

  if (req.query.all !== "true") {
    query.isActive = true;
  }

  const categories = await Category
    .find(query)
    .sort("order");

  return ApiResponse.success(
    res,
    categories
  );
});

exports.getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(
    req.params.id
  );

  if (!category) {
    return ApiResponse.error(
      res,
      "Kategori bulunamadı",
      404
    );
  }

  return ApiResponse.success(
    res,
    category
  );
});

exports.createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(
    req.body
  );

  return ApiResponse.success(
    res,
    category,
    "Kategori oluşturuldu",
    201
  );
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const category =
    await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );

  return ApiResponse.success(
    res,
    category,
    "Kategori güncellendi"
  );
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  // Bu kategoriye bağlı ürün varken silme engellenir: aksi halde o ürünlerin
  // category referansı öksüz kalır (populate → null), categorySlug çözülemez ve
  // pricingService'teki modül-kategori kural denetimi bu ürünler için devre dışı
  // kalmış olurdu (kural matrisinde kategoriye izin verilmeyen bir modül tipi bile
  // fiyatlanabilir hale gelirdi — bkz. computePrice/isModuleAllowedForCategory).
  const productCount = await Product.countDocuments({ category: req.params.id });
  if (productCount > 0) {
    return ApiResponse.error(
      res,
      `Bu kategoriye bağlı ${productCount} ürün var, önce onları başka bir kategoriye taşıyın veya silin`,
      400
    );
  }

  const category = await Category.findByIdAndDelete(
    req.params.id
  );

  if (!category) {
    return ApiResponse.error(
      res,
      "Kategori bulunamadı",
      404
    );
  }

  return ApiResponse.success(
    res,
    null,
    "Kategori silindi"
  );
});
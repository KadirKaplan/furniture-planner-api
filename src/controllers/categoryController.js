const Category = require("../models/Category");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../middleware/asyncHandler");

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category
    .find({ isActive: true })
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
  await Category.findByIdAndDelete(
    req.params.id
  );

  return ApiResponse.success(
    res,
    null,
    "Kategori silindi"
  );
});
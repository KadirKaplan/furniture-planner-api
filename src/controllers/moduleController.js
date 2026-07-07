const FurnitureModule = require("../models/FurnitureModule");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../middleware/asyncHandler");

exports.getModules = asyncHandler(async (req, res) => {
  const query = { isActive: true };
  if (req.query.slug) query.slug = req.query.slug;

  const modules = await FurnitureModule.find(query).sort("name");
  return ApiResponse.success(res, modules);
});

exports.getModule = asyncHandler(async (req, res) => {
  const module = await FurnitureModule.findById(req.params.id);
  if (!module) {
    return ApiResponse.error(res, "Modül bulunamadı", 404);
  }
  return ApiResponse.success(res, module);
});

exports.createModule = asyncHandler(async (req, res) => {
  const module = await FurnitureModule.create(req.body);
  return ApiResponse.success(res, module, "Modül oluşturuldu", 201);
});

exports.updateModule = asyncHandler(async (req, res) => {
  const module = await FurnitureModule.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!module) {
    return ApiResponse.error(res, "Modül bulunamadı", 404);
  }
  return ApiResponse.success(res, module, "Modül güncellendi");
});

exports.deleteModule = asyncHandler(async (req, res) => {
  const module = await FurnitureModule.findByIdAndDelete(req.params.id);
  if (!module) {
    return ApiResponse.error(res, "Modül bulunamadı", 404);
  }
  return ApiResponse.success(res, null, "Modül silindi");
});

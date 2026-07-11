const Material = require("../models/Material");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../middleware/asyncHandler");



exports.getMaterials = asyncHandler(
  async (req, res) => {
    const query = {};

    if (req.query.all !== "true") {
      query.isActive = true;
    }

    if (req.query.type) {
      query.type = req.query.type;
    }

    const materials =
      await Material.find(query);

    return ApiResponse.success(
      res,
      materials
    );
  }
);

exports.getMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);

  if (!material) {
    return ApiResponse.error(res, "Malzeme bulunamadı", 404);
  }

  return ApiResponse.success(res, material);
});

exports.createMaterial = asyncHandler(async (req, res) => {
  const material = await Material.create(req.body);

  return ApiResponse.success(
    res,
    material,
    "Malzeme oluşturuldu",
    201
  );
});

exports.updateMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!material) {
    return ApiResponse.error(res, "Malzeme bulunamadı", 404);
  }

  return ApiResponse.success(res, material, "Malzeme güncellendi");
});

exports.deleteMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findByIdAndDelete(req.params.id);

  if (!material) {
    return ApiResponse.error(res, "Malzeme bulunamadı", 404);
  }

  return ApiResponse.success(res, null, "Malzeme silindi");
});
const Material = require("../models/Material");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../middleware/asyncHandler");



exports.getMaterials = asyncHandler(
  async (req, res) => {
    const query = {};

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
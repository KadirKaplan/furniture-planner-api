const Setting = require("../models/Setting");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../middleware/asyncHandler");

// Salt-okunur: admin CMS üzerinden bu ayarları düzenleyemez, yalnızca DB'ye
// doğrudan (seed/migration script) müdahale ile değiştirilir — kasıtlı olarak
// burada create/update/delete endpoint'i yok.
exports.getSetting = asyncHandler(async (req, res) => {
  const setting = await Setting.findOne({ key: req.params.key });

  if (!setting) {
    return ApiResponse.error(res, "Ayar bulunamadı", 404);
  }

  return ApiResponse.success(res, setting.value);
});

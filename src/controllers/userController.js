const User = require("../models/User");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../middleware/asyncHandler");

exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).sort("email");
  return ApiResponse.success(res, users);
});

exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return ApiResponse.error(res, "Kullanıcı bulunamadı", 404);
  }

  return ApiResponse.success(res, user);
});

exports.createUser = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);
  // select:false yalnızca sorgularda alanı gizler — create()'ten dönen dokümanın
  // belleğindeki password alanı hâlâ dolu, response'a sızmaması için elle temizleniyor.
  user.password = undefined;

  return ApiResponse.success(res, user, "Kullanıcı oluşturuldu", 201);
});

exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return ApiResponse.error(res, "Kullanıcı bulunamadı", 404);
  }

  // findByIdAndUpdate şifre değişikliğinde pre("save") hash hook'unu tetiklemez —
  // bu yüzden dokümanı çekip alanları atayıp save() ile kaydediyoruz.
  Object.assign(user, req.body);
  await user.save();
  user.password = undefined;

  return ApiResponse.success(res, user, "Kullanıcı güncellendi");
});

exports.deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return ApiResponse.error(res, "Kendi hesabınızı silemezsiniz", 400);
  }

  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return ApiResponse.error(res, "Kullanıcı bulunamadı", 404);
  }

  return ApiResponse.success(res, null, "Kullanıcı silindi");
});

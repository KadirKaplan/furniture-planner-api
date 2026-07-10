const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("./asyncHandler");

exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return ApiResponse.error(res, "Yetkilendirme token'ı bulunamadı", 401);
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return ApiResponse.error(res, "Geçersiz veya süresi dolmuş token", 401);
  }

  const user = await User.findById(decoded.id);

  if (!user || !user.isActive) {
    return ApiResponse.error(res, "Kullanıcı bulunamadı veya pasif", 401);
  }

  req.user = user;
  next();
});

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return ApiResponse.error(res, "Bu işlem için yetkiniz yok", 403);
    }

    next();
  };
};

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../middleware/asyncHandler");

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return ApiResponse.error(res, "E-posta ve şifre zorunludur", 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user || !user.isActive) {
    return ApiResponse.error(res, "E-posta veya şifre hatalı", 401);
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return ApiResponse.error(res, "E-posta veya şifre hatalı", 401);
  }

  const token = generateToken(user._id);

  return ApiResponse.success(res, {
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  }, "Giriş başarılı");
});

exports.me = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, {
    id: req.user._id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role,
  });
});

const rateLimit = require("express-rate-limit");

exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Çok fazla giriş denemesi yapıldı, lütfen 15 dakika sonra tekrar deneyin",
  },
});

exports.globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin",
  },
});

exports.pricingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Fiyat hesaplama isteği çok sık yapıldı, lütfen biraz bekleyin",
  },
});

const express = require("express");
const router = express.Router();

const {
  calculatePrice,
  calculatePriceBatch,
} = require("../controllers/pricingController");
const asyncHandler = require("../middleware/asyncHandler");
const { requireClientOrAuth } = require("../middleware/publicAccess");

// Fiyat uçlarına ÖZEL bir limit yok: fiyat, planner'da her tasarım değişiminde
// tetiklenen normal bir okuma işidir ve kendi başına bir kaynak yaratmaz (Mongo'ya
// yazmaz, dosya yüklemez). Kötüye kullanıma karşı koruma, uygulama genelindeki
// globalLimiter'dan gelir (bkz. index.js) — tek ve genel tavan orada.
router.post("/calculate", requireClientOrAuth, asyncHandler(calculatePrice));

// Çok ürünlü tasarımın tamamını tek istekte fiyatlar (bkz. calculatePriceBatch).
router.post(
  "/calculate-batch",
  requireClientOrAuth,
  asyncHandler(calculatePriceBatch)
);

module.exports = router;

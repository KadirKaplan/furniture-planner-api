const express = require("express");
const router = express.Router();

const { calculatePrice } = require("../controllers/pricingController");
const asyncHandler = require("../middleware/asyncHandler");
const { requireClientOrAuth } = require("../middleware/publicAccess");
const { pricingLimiter } = require("../middleware/rateLimiters");

router.post("/calculate", pricingLimiter, requireClientOrAuth, asyncHandler(calculatePrice));

module.exports = router;

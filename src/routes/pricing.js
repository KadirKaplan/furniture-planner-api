const express = require("express");
const router = express.Router();

const { calculatePrice } = require("../controllers/pricingController");
const asyncHandler = require("../middleware/asyncHandler");

router.post("/calculate", asyncHandler(calculatePrice));

module.exports = router;

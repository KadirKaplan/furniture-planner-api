const express = require("express");
const router = express.Router();

const { login, me } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { loginLimiter } = require("../middleware/rateLimiters");

router.post("/login", loginLimiter, login);
router.get("/me", protect, me);

module.exports = router;

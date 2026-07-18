const express = require("express");
const router = express.Router();

const { getSetting } = require("../controllers/settingController");
const { requireClientOrAuth } = require("../middleware/publicAccess");

// Salt-okunur route — admin CMS üzerinden düzenleme yapamaz (bkz. settingController.js).
router.get("/:key", requireClientOrAuth, getSetting);

module.exports = router;

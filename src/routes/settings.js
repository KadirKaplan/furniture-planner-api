const express = require("express");
const router = express.Router();

const { getSetting, updateSetting } = require("../controllers/settingController");
const { requireClientOrAuth } = require("../middleware/publicAccess");
const { protect, authorize } = require("../middleware/auth");

router.get("/:key", requireClientOrAuth, getSetting);

// Yalnızca beyaz listedeki key'ler güncellenebilir (bkz. settingController.js) —
// şu an sadece "moduleCategoryRules" (CMS'teki kural matrisi ekranı kullanır).
router.put("/:key", protect, authorize("admin"), updateSetting);

module.exports = router;

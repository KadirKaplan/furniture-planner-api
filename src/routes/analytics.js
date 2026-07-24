const express = require("express");
const router = express.Router();

const { collect, summary } = require("../controllers/analyticsController");
const { requireClientOrAuth } = require("../middleware/publicAccess");
const { protect, authorize } = require("../middleware/auth");

// Toplama public (planner X-Client-Key ile gelir) ama okuma admin'e kapalı —
// istatistik özeti yalnızca showroom yöneticisi içindir.
router.post("/collect", requireClientOrAuth, collect);

router.get("/summary", protect, authorize("admin"), summary);

module.exports = router;

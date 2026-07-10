const express = require("express");
const router = express.Router();

const {
  getModules,
  getModule,
  createModule,
  updateModule,
  deleteModule,
} = require("../controllers/moduleController");
const { protect, authorize } = require("../middleware/auth");

router.route("/")
  .get(getModules)
  .post(protect, authorize("admin"), createModule);

router.route("/:id")
  .get(getModule)
  .put(protect, authorize("admin"), updateModule)
  .delete(protect, authorize("admin"), deleteModule);

module.exports = router;

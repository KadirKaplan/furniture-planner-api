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
const { requireClientOrAuth } = require("../middleware/publicAccess");
const validate = require("../middleware/validate");
const {
  moduleCreateSchema,
  moduleUpdateSchema,
} = require("../validators/moduleValidator");

router.route("/")
  .get(requireClientOrAuth, getModules)
  .post(protect, authorize("admin"), validate(moduleCreateSchema), createModule);

router.route("/:id")
  .get(requireClientOrAuth, getModule)
  .put(protect, authorize("admin"), validate(moduleUpdateSchema), updateModule)
  .delete(protect, authorize("admin"), deleteModule);

module.exports = router;

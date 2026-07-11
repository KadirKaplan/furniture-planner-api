const express = require("express");
const router = express.Router();

const {
  getMaterials,
  getMaterial,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} = require("../controllers/materialController");
const { protect, authorize } = require("../middleware/auth");
const { requireClientOrAuth } = require("../middleware/publicAccess");
const validate = require("../middleware/validate");
const {
  materialCreateSchema,
  materialUpdateSchema,
} = require("../validators/materialValidator");

router.route("/")
  .get(requireClientOrAuth, getMaterials)
  .post(protect, authorize("admin"), validate(materialCreateSchema), createMaterial);

router.route("/:id")
  .get(requireClientOrAuth, getMaterial)
  .put(protect, authorize("admin"), validate(materialUpdateSchema), updateMaterial)
  .delete(protect, authorize("admin"), deleteMaterial);

module.exports = router;
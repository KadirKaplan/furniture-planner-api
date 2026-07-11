const express = require("express");
const router = express.Router();

const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { protect, authorize } = require("../middleware/auth");
const { requireClientOrAuth } = require("../middleware/publicAccess");
const validate = require("../middleware/validate");
const {
  categoryCreateSchema,
  categoryUpdateSchema,
} = require("../validators/categoryValidator");

router.route("/")
  .get(requireClientOrAuth, getCategories)
  .post(protect, authorize("admin"), validate(categoryCreateSchema), createCategory);

router.route("/:id")
  .get(requireClientOrAuth, getCategory)
  .put(protect, authorize("admin"), validate(categoryUpdateSchema), updateCategory)
  .delete(protect, authorize("admin"), deleteCategory);

module.exports = router;
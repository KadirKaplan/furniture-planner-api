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

router.route("/")
  .get(getCategories)
  .post(protect, authorize("admin"), createCategory);

router.route("/:id")
  .get(getCategory)
  .put(protect, authorize("admin"), updateCategory)
  .delete(protect, authorize("admin"), deleteCategory);

module.exports = router;
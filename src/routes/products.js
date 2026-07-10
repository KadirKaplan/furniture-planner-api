const express = require("express");
const router = express.Router();

const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { protect, authorize } = require("../middleware/auth");

router.route("/")
  .get(protect, authorize("admin"), getProducts)
  .post(protect, authorize("admin"), createProduct);

router.route("/:id")
  .get(getProduct)
  .put(protect, authorize("admin"), updateProduct)
  .delete(protect, authorize("admin"), deleteProduct);

module.exports = router;
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
const { requireClientOrAuth } = require("../middleware/publicAccess");
const validate = require("../middleware/validate");
const {
  productCreateSchema,
  productUpdateSchema,
} = require("../validators/productValidator");

router.route("/")
  .get(requireClientOrAuth, getProducts)
  .post(protect, authorize("admin"), validate(productCreateSchema), createProduct);

router.route("/:id")
  .get(requireClientOrAuth, getProduct)
  .put(protect, authorize("admin"), validate(productUpdateSchema), updateProduct)
  .delete(protect, authorize("admin"), deleteProduct);

module.exports = router;
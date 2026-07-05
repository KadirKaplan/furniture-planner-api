const Product = require("../models/Product");
const Category = require("../models/Category");

const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../middleware/asyncHandler");


exports.getProducts = asyncHandler(
  async (req, res) => {
    const query = {};

    if (req.query.category) {
      const category =
        await Category.findOne({
          _id: req.query.category,
        });

      if (category) {
        query.category = category._id;
      }
    }

    const products =
      await Product.find(query)
        .populate(
          "category",
          "name slug"
        )
        .populate(
          "allowedMaterials",
          "name slug type"
        );

    return ApiResponse.success(
      res,
      products
    );
  }
);

exports.getProduct = asyncHandler(
  async (req, res) => {
    const product =
      await Product.findById(
        req.params.id
      )
        .populate("category")
        .populate(
          "allowedMaterials"
        );

    if (!product) {
      return ApiResponse.error(
        res,
        "Ürün bulunamadı",
        404
      );
    }

    return ApiResponse.success(
      res,
      product
    );
  }
);

exports.createProduct = asyncHandler(
  async (req, res) => {
    const product =
      await Product.create(
        req.body
      );

    return ApiResponse.success(
      res,
      product,
      "Ürün oluşturuldu",
      201
    );
  }
);


exports.updateProduct = asyncHandler(
  async (req, res) => {
    const product =
      await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
        }
      );

    return ApiResponse.success(
      res,
      product,
      "Ürün güncellendi"
    );
  }
);

exports.deleteProduct = asyncHandler(
  async (req, res) => {
    await Product.findByIdAndDelete(
      req.params.id
    );

    return ApiResponse.success(
      res,
      null,
      "Ürün silindi"
    );
  }
);
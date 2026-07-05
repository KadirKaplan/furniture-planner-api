const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: String,

    slug: String,

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    description: String,

    parametric: {
      type: Boolean,
      default: true,
    },

    basePrice: {
      type: Number,
      default: 0,
    },

    defaultWidth: Number,
    defaultHeight: Number,
    defaultDepth: Number,

    minWidth: Number,
    maxWidth: Number,

    minHeight: Number,
    maxHeight: Number,

    minDepth: Number,
    maxDepth: Number,

    allowedMaterials: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Material",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Product",
  productSchema
);
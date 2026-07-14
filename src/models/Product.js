const mongoose = require("mongoose");
const applyIdTransform = require("../utils/idTransform");

const productSchema = new mongoose.Schema(
  {
    name: String,

    slug: String,

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    description: String,

    icon: String,

    modelUrl: String,

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

    availableColors: [String],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

applyIdTransform(productSchema);

module.exports = mongoose.model(
  "Product",
  productSchema
);
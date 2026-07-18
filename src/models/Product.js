const mongoose = require("mongoose");
const applyIdTransform = require("../utils/idTransform");

const productSchema = new mongoose.Schema(
  {
    name: String,

    slug: {
      type: String,
      required: true,
      unique: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    description: String,

    assets: {
      icon: String,
      modelUrl: String,
    },

    parametric: {
      type: Boolean,
      default: true,
    },

    basePrice: {
      type: Number,
      default: 0,
    },

    dimensions: {
      defaultWidth: Number,
      defaultHeight: Number,
      defaultDepth: Number,

      minWidth: Number,
      maxWidth: Number,

      minHeight: Number,
      maxHeight: Number,

      minDepth: Number,
      maxDepth: Number,
    },

    // Tek kapağın alabileceği maksimum genişlik (cm). Dolu ise ürün kapak destekler:
    // FE kapak sayısını ceil(genişlik / maxDoorWidth) ile hesaplar ve ürünü parametrik
    // (WardrobeMesh) yolda çizerek kapak slotu/stil atamasını açar. Boş (null) ise
    // üründe kapak sistemi yoktur. Eskiden FE'de product.slug === "moduler-dolap"
    // hardcode'uydu — artık ürün başına CMS'ten yönetilir.
    maxDoorWidth: {
      type: Number,
      default: null,
    },

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
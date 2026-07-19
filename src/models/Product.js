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

    // Ürün başına materyal baz fiyatı override'ı. Materyalin fiyat etkisi üründen
    // ürüne değişir (ör. MDF Lake: modüler dolapta 20.000₺, komodinde 15.000₺ taban
    // fiyat gerektirir) — global Material.priceModifier yüzdesi bunu ifade edemez.
    // Seçilen materyal bu listedeyse alan fiyatı product.basePrice yerine buradaki
    // basePrice ile hesaplanır ve materyalin global yüzde modifier'ı UYGULANMAZ
    // (fiyat zaten materyale özel girilmiştir). Listede olmayan materyaller için
    // eski davranış sürer: basePrice × (1 + material.priceModifier / 100).
    materialBasePrices: [
      {
        material: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Material",
        },
        basePrice: {
          type: Number,
          default: 0,
        },
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
const mongoose = require("mongoose");
const applyIdTransform = require("../utils/idTransform");
const { MODULE_TYPES } = require("../config/moduleTypes");

// Ana modülün varyantları — ör. "Kapak" modülünün altına Düz/Kare/Rustik kapak stilleri
// birer alt modül olarak eklenir (CMS'te "Alt Modül Ekle" ile yönetilir). Her alt modül
// kendi ikon/3B modelini CDN'e yükleyebilir (isCustom true ise).
const submoduleSchema = new mongoose.Schema(
  {
    name: String,

    slug: {
      type: String,
      required: true,
    },

    description: String,

    // true: ikon/3B model CDN'e yüklenip assets üzerinden özelleştirilebilir (ör. kapak stilleri).
    // false: model Cabinet.tsx içinde prosedürel olarak çiziliyor — yükleme yapılamaz.
    isCustom: {
      type: Boolean,
      default: false,
    },

    assets: {
      icon: String,
      modelUrl: String,
    },

    // Yalnızca isCustom true olan alt modüller için: seçici rozetinin zemin/yazı rengi (UI amaçlı).
    swatchColor: String,
    swatchTextColor: String,

    priceModifier: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

applyIdTransform(submoduleSchema);

const moduleSchema = new mongoose.Schema(
  {
    name: String,

    slug: {
      type: String,
      required: true,
      unique: true,
    },

    // DAVRANIŞ tipi — FE'nin 3D/etkileşim mantığı ve kategori kuralları slug'a değil
    // buna göre eşleşir (bkz. config/moduleTypes.js). Slug yalnızca kimlik/URL amaçlıdır.
    type: {
      type: String,
      enum: MODULE_TYPES,
      required: true,
      default: "generic",
    },

    description: String,

    priceModifier: {
      type: Number,
      default: 0,
    },

    // true: ikon/3B model CDN'e yüklenip assets üzerinden özelleştirilebilir.
    // false: model Cabinet.tsx içinde prosedürel olarak çiziliyor (ör. raf, çekmece) — yükleme yapılamaz.
    isCustom: {
      type: Boolean,
      default: false,
    },

    assets: {
      icon: String,
      modelUrl: String,
    },

    swatchColor: String,
    swatchTextColor: String,

    submodules: [submoduleSchema],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

applyIdTransform(moduleSchema);

module.exports = mongoose.model(
  "FurnitureModule",
  moduleSchema
);

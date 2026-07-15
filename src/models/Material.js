const mongoose = require("mongoose");
const applyIdTransform = require("../utils/idTransform");

const colorSchema = new mongoose.Schema({
  name: String,

  hex: String,

  imageUrl: String,

  category: String,

  code: String,

  priceModifier: {
    type: Number,
    default: 0,
  },
});

const materialSchema = new mongoose.Schema(
  {
    name: String,

    slug: {
      type: String,
      required: true,
      unique: true,
    },

    type: {
      type: String,

      enum: [
        "mdflam",
        "mdflake",
        "glass",
        "metal",
        "supramat",
        "akrilik"
      ],
    },

    description: String,

    priceModifier: {
      type: Number,
      default: 0,
    },

    colors: [colorSchema],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

applyIdTransform(colorSchema);
applyIdTransform(materialSchema);

module.exports = mongoose.model(
  "Material",
  materialSchema
);
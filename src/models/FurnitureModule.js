const mongoose = require("mongoose");
const applyIdTransform = require("../utils/idTransform");

const moduleSchema = new mongoose.Schema(
  {
    name: String,

    slug: String,

    description: String,

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

applyIdTransform(moduleSchema);

module.exports = mongoose.model(
  "FurnitureModule",
  moduleSchema
);
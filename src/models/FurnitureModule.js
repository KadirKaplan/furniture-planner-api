const mongoose = require("mongoose");
const applyIdTransform = require("../utils/idTransform");

const moduleSchema = new mongoose.Schema(
  {
    name: String,

    slug: {
      type: String,
      required: true,
      unique: true,
    },

    description: String,

    type: {
      type: String,
      enum: ["generic", "door"],
      default: "generic",
    },

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
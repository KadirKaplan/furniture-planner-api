const mongoose = require("mongoose");

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

module.exports = mongoose.model(
  "FurnitureModule",
  moduleSchema
);
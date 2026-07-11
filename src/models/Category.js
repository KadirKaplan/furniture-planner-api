const mongoose = require("mongoose");
const applyIdTransform = require("../utils/idTransform");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
    },

    description: String,

    icon: String,

    order: {
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

applyIdTransform(categorySchema);

module.exports = mongoose.model(
  "Category",
  categorySchema
);
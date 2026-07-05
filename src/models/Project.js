const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    customerName: String,

    customerEmail: String,

    room: {
      width: Number,
      depth: Number,
      height: Number,
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },

        width: Number,
        height: Number,
        depth: Number,

        material: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Material",
        },

        color: String,

        modules: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FurnitureModule",
          },
        ],

        position: {
          x: Number,
          y: Number,
          z: Number,
        },
      },
    ],

    totalPrice: Number,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Project",
  projectSchema
);
const express = require("express");
const router = express.Router();

const {
  getMaterials,
  getMaterial,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} = require("../controllers/materialController");

router.route("/")
  .get(getMaterials)
  //.post(createMaterial);

// router.route("/:id")
//   .get(getMaterial)
//   .put(updateMaterial)
//   .delete(deleteMaterial);

module.exports = router;
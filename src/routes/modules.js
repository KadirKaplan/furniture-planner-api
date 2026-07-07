const express = require("express");
const router = express.Router();

const {
  getModules,
  getModule,
  createModule,
  updateModule,
  deleteModule,
} = require("../controllers/moduleController");

router.route("/")
  .get(getModules)
  .post(createModule);

router.route("/:id")
  .get(getModule)
  .put(updateModule)
  .delete(deleteModule);

module.exports = router;

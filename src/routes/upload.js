const express = require("express");
const router = express.Router();

const { uploadIcon, uploadModel } = require("../controllers/uploadController");
const { iconUpload, modelUpload } = require("../middleware/upload");
const { protect, authorize } = require("../middleware/auth");

router.post("/icon", protect, authorize("admin"), iconUpload, uploadIcon);
router.post("/model", protect, authorize("admin"), modelUpload, uploadModel);

module.exports = router;

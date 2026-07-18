const multer = require("multer");

const ICON_MAX_BYTES = 1024 * 1024; // 1 MB
const MODEL_MAX_BYTES = 50 * 1024 * 1024; // 50 MB

const ICON_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];
const ICON_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

const uploadError = (message) => {
  const err = new Error(message);
  err.isUploadError = true;
  return err;
};

const extensionOf = (filename) => {
  const match = /\.[^.]+$/.exec(filename || "");
  return match ? match[0].toLowerCase() : "";
};

const iconUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: ICON_MAX_BYTES },
  fileFilter: (req, file, cb) => {
    const ext = extensionOf(file.originalname);
    if (!ICON_MIME_TYPES.includes(file.mimetype) || !ICON_EXTENSIONS.includes(ext)) {
      return cb(uploadError("Sadece PNG, JPG/JPEG  formatında ikon yükleyebilirsiniz"));
    }
    cb(null, true);
  },
}).single("file");

const modelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MODEL_MAX_BYTES },
  fileFilter: (req, file, cb) => {
    const ext = extensionOf(file.originalname);
    if (ext !== ".glb") {
      return cb(uploadError("3D model olarak sadece .glb formatı kabul edilir"));
    }
    cb(null, true);
  },
}).single("file");

module.exports = {
  iconUpload,
  modelUpload,
  ICON_MAX_BYTES,
  MODEL_MAX_BYTES,
  extensionOf,
  uploadError,
};

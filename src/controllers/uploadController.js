const { PutObjectCommand } = require("@aws-sdk/client-s3");
const r2Client = require("../config/r2");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../middleware/asyncHandler");
const { extensionOf } = require("../middleware/upload");

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const publicUrlFor = (key) => {
  const base = (process.env.R2_CDN_URL || "").replace(/\/+$/, "");
  return `${base}/${key}`;
};

const putObject = async (key, body, contentType) => {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
};

exports.uploadIcon = asyncHandler(async (req, res) => {
  if (!req.file) {
    return ApiResponse.error(res, "Yüklenecek dosya bulunamadı", 400);
  }

  const slug = (req.body.slug || "").trim().toLowerCase();

  if (!SLUG_PATTERN.test(slug)) {
    return ApiResponse.error(
      res,
      "Geçerli bir slug gereklidir (küçük harf, rakam ve tire)",
      400
    );
  }

  const ext = extensionOf(req.file.originalname);
  const key = `icons/${slug}${ext}`;

  await putObject(key, req.file.buffer, req.file.mimetype);

  return ApiResponse.success(
    res,
    { url: publicUrlFor(key) },
    "İkon yüklendi"
  );
});

exports.uploadModel = asyncHandler(async (req, res) => {
  if (!req.file) {
    return ApiResponse.error(res, "Yüklenecek dosya bulunamadı", 400);
  }

  const slug = (req.body.slug || "").trim().toLowerCase();

  if (!SLUG_PATTERN.test(slug)) {
    return ApiResponse.error(
      res,
      "Geçerli bir slug gereklidir (küçük harf, rakam ve tire)",
      400
    );
  }

  const key = `models/${slug}.glb`;

  await putObject(key, req.file.buffer, "model/gltf-binary");

  return ApiResponse.success(
    res,
    { url: publicUrlFor(key) },
    "3D model yüklendi"
  );
});

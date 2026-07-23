const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const r2Client = require("../config/r2");

/**
 * R2'ye yazma işinin tek yeri. uploadController (admin ikon/model yüklemesi) ve
 * quoteRequestController (teklif snapshot'ı) aynı bucket/CDN kurallarını buradan
 * paylaşır — public URL üretimi iki yerde ayrı ayrı yazılırsa CDN adresi
 * değiştiğinde biri güncellenmeden kalır.
 */
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

/**
 * Public CDN URL'inden bucket key'ini geri çözer ("https://cdn…/quotes/x.png" →
 * "quotes/x.png"). Kayıtta yalnızca tam URL saklandığı için silme işleminde key'e
 * buradan dönülür. URL beklenen CDN kökünden gelmiyorsa null döner — yabancı bir
 * adresten türetilmiş key ile bucket'ta silme yapılmamalı.
 */
const keyFromPublicUrl = (url) => {
  const base = (process.env.R2_CDN_URL || "").replace(/\/+$/, "");
  if (!base || typeof url !== "string" || !url.startsWith(`${base}/`)) return null;
  return url.slice(base.length + 1) || null;
};

const deleteObject = async (key) => {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    })
  );
};

module.exports = { publicUrlFor, putObject, deleteObject, keyFromPublicUrl };

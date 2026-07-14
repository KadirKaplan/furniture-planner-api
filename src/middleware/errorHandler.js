const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Multer dosya yükleme hataları (boyut sınırı vb.)
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "Dosya boyutu izin verilen sınırı aşıyor",
      });
    }
    return res.status(400).json({ success: false, error: "Dosya yükleme hatası" });
  }

  // Upload middleware/controller'da bilinçli olarak fırlatılan, kullanıcıya
  // gösterilmesi güvenli mesajlar (örn. desteklenmeyen dosya formatı)
  if (err.isUploadError) {
    return res.status(400).json({ success: false, error: err.message });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, error: messages.join(", ") });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ success: false, error: `Bu ${field} zaten mevcut` });
  }

  // Mongoose CastError (geçersiz ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({ success: false, error: "Geçersiz ID formatı" });
  }

  // Kategorize edilmemiş/beklenmeyen hatalar: ayrıntılar sadece sunucu logunda
  // kalır (yukarıdaki console.error), client'a iç yapıyı sızdırmayan sabit mesaj döner.
  res.status(err.status || 500).json({
    success: false,
    error: "Sunucu hatası",
  });
};

module.exports = errorHandler;

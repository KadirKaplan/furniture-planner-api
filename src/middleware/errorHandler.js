const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

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

  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Sunucu hatası",
  });
};

module.exports = errorHandler;

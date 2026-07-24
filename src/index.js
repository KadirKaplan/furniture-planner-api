require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");

const connectDB = require("./config/db");
const { globalLimiter } = require("./middleware/rateLimiters");
const errorHandler = require("./middleware/errorHandler");

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const categoryRoutes = require("./routes/categories");
const productRoutes = require("./routes/products");
const materialRoutes = require("./routes/materials");
const moduleRoutes = require("./routes/modules");
//const projectRoutes = require("./routes/projects");
const pricingRoutes = require("./routes/pricing");
const uploadRoutes = require("./routes/upload");
const settingRoutes = require("./routes/settings");
const quoteRequestRoutes = require("./routes/quoteRequests");
const analyticsRoutes = require("./routes/analytics");
const app = express();

// Mongo Connection
connectDB();

// Ters proxy (nginx / Cloudflare / PaaS) arkasındaysak req.ip soket adresini değil
// X-Forwarded-For'u göstermeli — aksi halde TÜM istekler proxy'nin tek IP'sine
// düşer ve IP başına rate limit ya herkesi tek kovaya toplar ya da hiç çalışmaz.
//
// Değer env'den gelir çünkü doğrusu dağıtıma bağlıdır ve "hepsine güven" tehlikelidir:
// proxy yoksa saldırgan X-Forwarded-For başlığını kendi uydurup her istekte farklı
// IP'ymiş gibi görünerek limiti tamamen atlar. Bu yüzden varsayılan KAPALI.
//   TRUST_PROXY=1       → önünde tek proxy var (en yaygın)
//   TRUST_PROXY=2       → iki katman (ör. CDN + yük dengeleyici)
//   TRUST_PROXY=false   → doğrudan internete açık
if (process.env.TRUST_PROXY) {
  const raw = process.env.TRUST_PROXY;
  app.set("trust proxy", /^\d+$/.test(raw) ? Number(raw) : raw === "true");
}

// Middlewares
app.use(helmet());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Origin header'ı olmayan istekler (curl/Postman/server-to-server) burada
      // engellenmiyor — CORS sadece tarayıcı kaynaklı istekleri kısıtlar, bu
      // yüzden asıl erişim kontrolü requireClientOrAuth middleware'inde yapılır.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS: Bu origin'e izin verilmiyor"));
    },
  })
);

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(mongoSanitize());

app.use(morgan("dev"));

app.use(globalLimiter);

// Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Eyce Designer API",
    version: "1.0.0",
  });
});

// API Routes
app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/categories", categoryRoutes);

app.use("/api/products", productRoutes);

app.use("/api/materials", materialRoutes);

app.use("/api/modules", moduleRoutes);

// app.use("/api/projects", projectRoutes);

app.use("/api/pricing", pricingRoutes);

app.use("/api/upload", uploadRoutes);

app.use("/api/settings", settingRoutes);

app.use("/api/quote-requests", quoteRequestRoutes);

app.use("/api/analytics", analyticsRoutes);

// 404
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`
🚀 Eyce Designer API Running
📡 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV}
  `);
});
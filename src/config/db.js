const mongoose = require("mongoose");

// Vercel serverless ortamında her cold start yeni bir modül yüklemesi demek;
// bağlantıyı global'de cache'lemezsek warm invocation'lar arasında bile
// tekrar tekrar connect() çağrılır ve Atlas bağlantı limiti hızla tükenir.
let cached = global._mongooseConn;
if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI, { dbName: "furnitureDB" })
      .then((conn) => {
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
        return conn;
      })
      .catch((error) => {
        cached.promise = null;
        console.error("❌ MongoDB connection error:", error.message);
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;

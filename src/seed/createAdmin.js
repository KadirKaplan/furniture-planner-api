require("dotenv").config({
  path: require("path").join(__dirname, "../../.env"),
});

const connectDB = require("../config/db");
const User = require("../models/User");

const createAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";

  if (!email || !password) {
    console.error(
      "❌ ADMIN_EMAIL ve ADMIN_PASSWORD .env dosyasında tanımlı olmalı"
    );
    process.exit(1);
  }

  try {
    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });

    if (existing) {
      console.log(`ℹ️  ${email} zaten kayıtlı, işlem atlandı`);
      process.exit(0);
    }

    const admin = await User.create({
      email,
      password,
      name,
      role: "admin",
    });

    console.log(`✅ Admin kullanıcı oluşturuldu: ${admin.email}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Admin oluşturulamadı:", error.message);
    process.exit(1);
  }
};

createAdmin();

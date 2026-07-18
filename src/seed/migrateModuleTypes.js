require("dotenv").config({
  path: require("path").join(__dirname, "../../.env"),
});

const connectDB = require("../config/db");
const FurnitureModule = require("../models/FurnitureModule");
const Product = require("../models/Product");
const Setting = require("../models/Setting");
const { MODULE_TYPES } = require("../config/moduleTypes");

// "type" enum'una geçiş migration'ı (bkz. config/moduleTypes.js):
// 1. Mevcut modüllere type backfill edilir — bilinen slug'lar (door/drawer/shelf/mattress)
//    birebir kopyalanır; alt modülü olan ama slug'ı farklı modüller kapak sayılır (eski
//    "alt modülü olan = kapak" sezgisinin veriye dökülmüş hali); kalanlar "generic".
// 2. moduleCategoryRules'a komodin için "door" eklenir (komodinde kapak sistemi açıldı).
// 3. Kapak destekleyen ürünlere maxDoorWidth yazılır (eskiden FE'de
//    product.slug === "moduler-dolap" hardcode'uydu).
const migrate = async () => {
  try {
    await connectDB();

    console.log("🔧 Modül tipi migration'ı başlıyor...");

    /*
     * 1) FurnitureModule.type backfill — Mongoose default'u okuma anında uyguladığı
     * için document.save() ile "alan gerçekten DB'de var mı" ayırt edilemez; bu yüzden
     * doğrudan updateMany kullanılır (idempotent, tekrar çalıştırılabilir).
     */
    const knownSlugs = MODULE_TYPES.filter((t) => t !== "generic");

    // Bilinen slug'lar (door/drawer/shelf/mattress) type'a birebir kopyalanır
    const r1 = await FurnitureModule.updateMany(
      { slug: { $in: knownSlugs } },
      [{ $set: { type: "$slug" } }]
    );

    // Slug'ı farklı ama alt modülü olan modül kapaktır (eski sezgi veriye dökülür)
    const r2 = await FurnitureModule.updateMany(
      { type: { $exists: false }, "submodules.0": { $exists: true } },
      { $set: { type: "door" } }
    );

    // Kalan her şey generic
    const r3 = await FurnitureModule.updateMany(
      { type: { $exists: false } },
      { $set: { type: "generic" } }
    );

    console.log(
      `✅ type backfill: ${r1.modifiedCount} slug'dan, ${r2.modifiedCount} kapak (alt modüllü), ${r3.modifiedCount} generic`
    );

    /*
     * 2) Kural setine komodin için "door" ekle
     */
    const setting = await Setting.findOne({ key: "moduleCategoryRules" });
    if (setting) {
      const rules = { ...(setting.value ?? {}) };
      const komodin = new Set(rules.komodin ?? []);
      if (!komodin.has("door")) {
        komodin.add("door");
        rules.komodin = Array.from(komodin);
        setting.value = rules;
        setting.markModified("value");
        await setting.save();
        console.log("✅ moduleCategoryRules: komodin kategorisine \"door\" eklendi");
      } else {
        console.log("ℹ️ moduleCategoryRules: komodin zaten \"door\" içeriyor");
      }
    } else {
      console.log("⚠️ moduleCategoryRules kaydı bulunamadı — seed çalıştırılmalı");
    }

    /*
     * 3) Ürünlere maxDoorWidth (cm)
     */
    const DOOR_WIDTHS = {
      "moduler-dolap": 50,
      "2-komodin": 60,
      "tek-kapakli": 60,
    };

    for (const [slug, maxDoorWidth] of Object.entries(DOOR_WIDTHS)) {
      const res = await Product.updateOne(
        { slug, maxDoorWidth: null },
        { maxDoorWidth }
      );
      if (res.modifiedCount > 0) {
        console.log(`✅ "${slug}" ürününe maxDoorWidth: ${maxDoorWidth} yazıldı`);
      }
    }

    console.log("\n🎉 Migration tamamlandı");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

migrate();

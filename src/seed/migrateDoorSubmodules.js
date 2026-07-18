require("dotenv").config({
  path: require("path").join(__dirname, "../../.env"),
});

const connectDB = require("../config/db");
const FurnitureModule = require("../models/FurnitureModule");

// Önceki migration (migrateModuleAssets.js) kapak stillerini (duz/kare-kapak/rustik-kapak)
// bağımsız üst düzey FurnitureModule dokümanları olarak oluşturmuştu. Bu script onları
// "door" (Kapak) modülünün submodules dizisine taşır ve bağımsız dokümanları siler —
// var olan assets/isCustom/swatch verisi korunarak.
const STYLE_SLUGS = ["duz", "kare-kapak", "rustik-kapak"];

const migrate = async () => {
  try {
    await connectDB();

    console.log("🌱 Kapak stilleri submodule'e taşınıyor...");

    const doorModule = await FurnitureModule.findOne({ slug: "door" });
    if (!doorModule) {
      throw new Error('"door" slug\'lı ana Kapak modülü bulunamadı');
    }

    const standaloneStyles = await FurnitureModule.find({ slug: { $in: STYLE_SLUGS } });

    const existingSubSlugs = new Set(doorModule.submodules.map((s) => s.slug));
    let movedCount = 0;

    for (const style of standaloneStyles) {
      if (existingSubSlugs.has(style.slug)) {
        console.log(`↷ "${style.slug}" zaten submodules içinde, atlanıyor`);
        continue;
      }
      doorModule.submodules.push({
        name: style.name,
        slug: style.slug,
        description: style.description,
        isCustom: style.isCustom,
        assets: style.assets,
        swatchColor: style.swatchColor,
        swatchTextColor: style.swatchTextColor,
        priceModifier: style.priceModifier ?? 0,
        isActive: style.isActive,
      });
      movedCount += 1;
    }

    await doorModule.save();
    console.log(`✅ ${movedCount} kapak stili "door" modülünün submodules alanına taşındı`);

    const deleteResult = await FurnitureModule.deleteMany({ slug: { $in: STYLE_SLUGS } });
    console.log(`✅ ${deleteResult.deletedCount} bağımsız kapak stili dokümanı silindi`);

    console.log("🎉 Migration tamamlandı");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration başarısız:", error);
    process.exit(1);
  }
};

migrate();

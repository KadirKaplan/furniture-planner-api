require("dotenv").config({
  path: require("path").join(__dirname, "../../.env"),
});

const connectDB = require("../config/db");
const FurnitureModule = require("../models/FurnitureModule");

// Kapak stili katalogu: eskiden frontend'de sabit kodlu olan DOOR_STYLES verisinin
// DB karşılığı. slug'a göre upsert edilir — zaten varsa (ör. CMS'ten elle girilmiş
// assets/swatch değerleri) $setOnInsert sayesinde ÜZERİNE YAZILMAZ, sadece eksikse oluşturulur.
const DOOR_STYLE_SEEDS = [
  {
    slug: "duz",
    name: "Düz Kapak",
    description: "Düz panel, renk/dekor dokulu kutu",
    assets: {},
    swatchColor: "#e4d9c9",
    swatchTextColor: "#4a3f30",
  },
  {
    slug: "kare-kapak",
    name: "Kare Kapak",
    description: "Kare desenli kapak paneli",
    assets: {
      icon: "https://pub-a3ce010822b64aaaaea5e17cb19ef77b.r2.dev/icons/kare-kapak.png",
      modelUrl: "https://pub-a3ce010822b64aaaaea5e17cb19ef77b.r2.dev/models/kare-kapak.glb",
    },
    swatchColor: "#8a6d4b",
    swatchTextColor: "#ffffff",
  },
  {
    slug: "rustik-kapak",
    name: "Rustik Kapak",
    description: "Rustik ahşap dokulu kapak paneli",
    assets: {
      icon: "https://pub-a3ce010822b64aaaaea5e17cb19ef77b.r2.dev/icons/rustik-kapak.png",
      modelUrl: "https://pub-a3ce010822b64aaaaea5e17cb19ef77b.r2.dev/models/rustik-kapak.glb",
    },
    swatchColor: "#bcd9ea",
    swatchTextColor: "#1f4a5c",
  },
];

const migrate = async () => {
  try {
    await connectDB();

    console.log("🌱 FurnitureModule migration başlıyor...");

    // 1) Mevcut tüm modüllere (kapak/çekmece/raf/askılık/ayna/yatak) eksik isCustom/type
    //    alanlarını ekle — bunlar kod içinde çiziliyor, CDN'den özelleştirilemez.
    const isCustomResult = await FurnitureModule.updateMany(
      { isCustom: { $exists: false } },
      { $set: { isCustom: false } }
    );
    console.log(`✅ isCustom alanı eklendi: ${isCustomResult.modifiedCount} modül güncellendi`);

    const typeResult = await FurnitureModule.updateMany(
      { type: { $exists: false } },
      { $set: { type: "generic" } }
    );
    console.log(`✅ type alanı eklendi: ${typeResult.modifiedCount} modül güncellendi`);

    // Product'taki assets yapısıyla birebir tutarlı olsun diye isCustom:false olan
    // modüllerde de (raf/çekmece gibi) assets alanı boş obje olarak Mongo'da fiilen var
    // olsun — CMS zaten isCustom false iken ikon/model yüklemesine izin vermiyor, ama
    // alanın kendisi eksik/undefined kalmasın.
    const assetsResult = await FurnitureModule.updateMany(
      { assets: { $exists: false } },
      { $set: { assets: {} } }
    );
    console.log(`✅ assets alanı eklendi: ${assetsResult.modifiedCount} modül güncellendi`);

    // 2) Kapak stili modüllerini upsert et (var olan dokümanlara dokunmaz, yalnızca eksik olanı oluşturur)
    let createdCount = 0;
    for (const style of DOOR_STYLE_SEEDS) {
      const res = await FurnitureModule.updateOne(
        { slug: style.slug },
        {
          $setOnInsert: {
            name: style.name,
            slug: style.slug,
            description: style.description,
            type: "door",
            isCustom: true,
            priceModifier: 0,
            isActive: true,
            assets: style.assets,
            swatchColor: style.swatchColor,
            swatchTextColor: style.swatchTextColor,
          },
        },
        { upsert: true }
      );
      if (res.upsertedCount > 0) createdCount += 1;
    }
    console.log(`✅ Kapak stili modülleri: ${createdCount} yeni oluşturuldu, ${DOOR_STYLE_SEEDS.length - createdCount} zaten mevcuttu`);

    console.log("🎉 Migration tamamlandı");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration başarısız:", error);
    process.exit(1);
  }
};

migrate();

require("dotenv").config({
  path: require("path").join(__dirname, "../../.env"),
});

const connectDB = require("../config/db");

const Category = require("../models/Category");
const Material = require("../models/Material");
const Product = require("../models/Product");
const FurnitureModule = require("../models/FurnitureModule");
const mdfLamDecors = require("./mdfLamDecors");
const ralColors = require("./ralColors");

const seed = async () => {
  try {
    await connectDB();

    console.log("🌱 Seed başlıyor...");

    await Category.deleteMany({});
    await Material.deleteMany({});
    await Product.deleteMany({});
    await FurnitureModule.deleteMany({});

    /*
     * CATEGORIES
     */

    const categories = await Category.insertMany([
      {
        name: "Dolap",
        slug: "dolap",
        description: "Gardırop ve modüler dolap sistemleri",
        order: 1,
      },

      {
        name: "Karyola",
        slug: "karyola",
        description: "Karyola modülleri",
        order: 2,
      },

      {
        name: "TV Ünitesi",
        slug: "tv-unitesi",
        description: "TV ve medya üniteleri",
        order: 3,
      },

      {
        name: "Komodin",
        slug: "komodin",
        description: "Yatak odası komodinleri",
        order: 4,
      },

      {
        name: "Masa",
        slug: "masa",
        description: "Çalışma masaları",
        order: 5,
      },
      {
        name: "Kitaplık",
        slug: "kitaplık",
        description: "Kitaplık modülleri",
        order: 6,
      },
      {
        name: "Şifonyer",
        slug: "şifonyer",
        description: "Şifonyer modülleri",
        order: 7,
      },
      {
        name: "Kahve Köşesi",
        slug: "kahve-köşesi",
        description: "Kahve köşesi modülleri",
        order: 8,
      },
      {
        name: "Diğer",
        slug: "diğer",
        description: "Diğer modüller",
        order: 9,
      },
    ]);

    console.log(
      `✅ ${categories.length} kategori oluşturuldu`
    );

    /*
     * MATERIALS
     */

    const materials = await Material.insertMany([
      {
        name: "MDF Lam",

        slug: "mdf-lam",

        type: "mdflam",

        description: "Melamin kaplı MDF",

        priceModifier: 12000,

        colors: mdfLamDecors,
      },

      {
        name: "MDF Lake",

        slug: "mdf-lake",

        type: "mdflake",

        description: "Lake boyalı MDF",

        priceModifier: 18000,

        colors: ralColors,
      },

      {
        name: "Cam",

        slug: "cam",

        type: "glass",

        description: "Dolap ve vitrin camları",

        priceModifier: 500,

        colors: [
          {
            name: "Şeffaf",
            hex: "#E8F5FF",
          },

          {
            name: "Füme",
            hex: "#6E6E6E",
          },

          {
            name: "Bronz",
            hex: "#8C6239",
          },
        ],
      },

      {
        name: "Metal",

        slug: "metal",

        type: "metal",

        description: "Metal profil ve ayak sistemleri",

        priceModifier: 300,

        colors: [
          {
            name: "Siyah",
            hex: "#1C1C1C",
          },

          {
            name: "Beyaz",
            hex: "#F2F2F2",
          },

          {
            name: "Gold",
            hex: "#D4AF37",
            priceModifier: 250,
          },
        ],
      },
      {
        name: "Supramat",

        slug: "supramat",

        type: "supramat",

        description: "Supramat kaplamalı MDF",

        priceModifier: 300,

        colors: [
          {
            name: "Siyah",
            hex: "#1C1C1C",
          },

          {
            name: "Beyaz",
            hex: "#F2F2F2",
          },

          {
            name: "Gold",
            hex: "#D4AF37",
            priceModifier: 250,
          },
        ],
      },
      {
        name: "Akrilik",

        slug: "akrilik",

        type: "akrilik",

        description: "Akrilik kaplamalı MDF",

        priceModifier: 300,

        colors: [
          {
            name: "Siyah",
            hex: "#1C1C1C",
          },

          {
            name: "Beyaz",
            hex: "#F2F2F2",
          },

          {
            name: "Gold",
            hex: "#D4AF37",
            priceModifier: 250,
          },
        ],
      },
    ]);

    console.log(
      `✅ ${materials.length} malzeme oluşturuldu`
    );

    const matBySlug = {};

    materials.forEach((material) => {
      matBySlug[material.slug] = material._id;
    });

    /*
     * MODULES
     */

    const modules = await FurnitureModule.insertMany([
      {
        name: "Kapak",
        slug: "door",
        description: "Açılır dolap kapağı",
        priceModifier: 450,
      },

      {
        name: "Çekmece",
        slug: "drawer",
        description: "Raylı çekmece sistemi",
        priceModifier: 700,
      },

      {
        name: "Raf",
        slug: "shelf",
        description: "Sabit veya hareketli raf",
        priceModifier: 150,
      },

      {
        name: "Askılık",
        slug: "hanger",
        description: "Kıyafet askı borusu",
        priceModifier: 120,
      },

      {
        name: "Ayna",
        slug: "mirror",
        description: "Kapak aynası",
        priceModifier: 900,
      },

      {
        name: "Yatak",
        slug: "mattress",
        description: "Karyola iç ölçüsünden otomatik hesaplanan yatak boyutu",
        priceModifier: 0,
      },
    ]);

    console.log(
      `✅ ${modules.length} modül oluşturuldu`
    );

    /*
     * PRODUCTS
     */

    const products = await Product.insertMany([
      {
        name: "Modüler Dolap",

        slug: "moduler-dolap",

        category: categories[0]._id,

        description:
          "Parametrik gardırop sistemi",

        parametric: true,

        basePrice: 12000,

        defaultWidth: 100,
        defaultHeight: 236,
        defaultDepth: 58,

        minWidth: 40,
        maxWidth: 300,

        minHeight: 60,
        maxHeight: 300,

        minDepth: 30,
        maxDepth: 80,

        allowedMaterials: [
          matBySlug["mdf-lam"],
          matBySlug["mdf-lake"],
        ],

        isActive: true,
      },

      {
        name: "Karyola",

        slug: "karyola",

        category: categories[1]._id,

        description: "Başlıklı çift kişilik karyola",

        parametric: true,

        basePrice: 0,

        defaultWidth: 160,
        defaultHeight: 90,
        defaultDepth: 200,

        minWidth: 90,
        maxWidth: 200,

        minHeight: 70,
        maxHeight: 120,

        minDepth: 190,
        maxDepth: 220,

        allowedMaterials: [
          matBySlug["mdf-lam"],
          matBySlug["mdf-lake"],
        ],

        isActive: true,
      },

      {
        name: "TV Ünitesi",

        slug: "tv-unitesi",

        category: categories[2]._id,

        parametric: true,

        basePrice: 0,

        defaultWidth: 180,
        defaultHeight: 50,
        defaultDepth: 40,

        minWidth: 100,
        maxWidth: 400,

        minHeight: 30,
        maxHeight: 120,

        minDepth: 30,
        maxDepth: 60,

        allowedMaterials: [
          matBySlug["mdf-lam"],
          matBySlug["mdf-lake"],
        ],

        isActive: true,
      },

      {
        name: "İki Çekmeceli Komodin",

        slug: "2-komodin",

        category: categories[3]._id,

        parametric: true,

        basePrice: 0,

        defaultWidth: 50,
        defaultHeight: 60,
        defaultDepth: 40,

        minWidth: 40,
        maxWidth: 80,

        minHeight: 40,
        maxHeight: 80,

        minDepth: 35,
        maxDepth: 60,

        allowedMaterials: [
          matBySlug["mdf-lam"],
          matBySlug["mdf-lake"],
        ],

        isActive: true,
      },

      {
        name: "Çalışma Masası",

        slug: "calisma-masasi",

        category: categories[4]._id,

        description: "Çalışma ve yemek masası",

        parametric: true,

        basePrice: 0,

        defaultWidth: 120,
        defaultHeight: 75,
        defaultDepth: 60,

        minWidth: 80,
        maxWidth: 200,

        minHeight: 70,
        maxHeight: 80,

        minDepth: 50,
        maxDepth: 90,

        allowedMaterials: [
          matBySlug["mdf-lam"],
          matBySlug["mdf-lake"],
        ],

        isActive: true,
      },

      {
        name: "Kitaplık",

        slug: "kitaplik",

        category: categories[5]._id,

        description: "Açık raflı kitaplık",

        parametric: true,

        basePrice: 0,

        defaultWidth: 90,
        defaultHeight: 180,
        defaultDepth: 30,

        minWidth: 60,
        maxWidth: 200,

        minHeight: 100,
        maxHeight: 240,

        minDepth: 25,
        maxDepth: 40,

        allowedMaterials: [
          matBySlug["mdf-lam"],
          matBySlug["mdf-lake"],
        ],

        isActive: true,
      },

      {
        name: "Şifonyer",

        slug: "sifonyer",

        category: categories[6]._id,

        description: "Çok çekmeceli şifonyer",

        parametric: true,

        basePrice: 0,

        defaultWidth: 100,
        defaultHeight: 90,
        defaultDepth: 45,

        minWidth: 60,
        maxWidth: 160,

        minHeight: 70,
        maxHeight: 110,

        minDepth: 40,
        maxDepth: 55,

        allowedMaterials: [
          matBySlug["mdf-lam"],
          matBySlug["mdf-lake"],
        ],

        isActive: true,
      },

      {
        name: "Kahve Köşesi",

        slug: "kahve-kosesi",

        category: categories[7]._id,

        description: "Kahve köşesi ünitesi",

        parametric: true,

        basePrice: 0,

        defaultWidth: 80,
        defaultHeight: 90,
        defaultDepth: 40,

        minWidth: 50,
        maxWidth: 120,

        minHeight: 70,
        maxHeight: 110,

        minDepth: 30,
        maxDepth: 50,

        allowedMaterials: [
          matBySlug["mdf-lam"],
          matBySlug["mdf-lake"],
        ],

        isActive: true,
      },
    ]);

    console.log(
      `✅ ${products.length} ürün oluşturuldu`
    );

    console.log("\n🎉 Seed tamamlandı");

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seed();
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

        assets: {
          icon: "https://cdn.eycestudio.com/icons/moduler-dolap.png",
          modelUrl: "https://cdn.eycestudio.com/models/moduler-dolap.glb",
        },

        parametric: true,

        basePrice: 12000,

        dimensions: {
          defaultWidth: 100,
          defaultHeight: 200,
          defaultDepth: 58,

          minWidth: 40,
          maxWidth: 300,

          minHeight: 60,
          maxHeight: 300,

          minDepth: 30,
          maxDepth: 80,
        },

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

        description: "120x200 karyola",

        assets: {
          icon: "https://cdn.eycestudio.com/icons/karyola.png",
          modelUrl: "https://cdn.eycestudio.com/models/karyola.glb",
        },

        parametric: true,

        basePrice: 21500,

        dimensions: {
          defaultWidth: 120,
          defaultHeight: 110,
          defaultDepth: 200,

          minWidth: 80,
          maxWidth: 200,

          minHeight: 100,
          maxHeight: 120,

          minDepth: 180,
          maxDepth: 200,
        },

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

        dimensions: {
          defaultWidth: 180,
          defaultHeight: 50,
          defaultDepth: 40,

          minWidth: 100,
          maxWidth: 400,

          minHeight: 30,
          maxHeight: 120,

          minDepth: 30,
          maxDepth: 60,
        },

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

        assets: {
          icon: "https://cdn.eycestudio.com/icons/2-komodin.png",
          modelUrl: "https://cdn.eycestudio.com/models/2-komodin.glb",
        },

        parametric: true,

        basePrice: 10000,

        dimensions: {
          defaultWidth: 60,
          defaultHeight: 70,
          defaultDepth: 40,

          minWidth: 40,
          maxWidth: 80,

          minHeight: 40,
          maxHeight: 80,

          minDepth: 35,
          maxDepth: 60,
        },

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

        assets: {
          icon: "https://pub-a3ce010822b64aaaaea5e17cb19ef77b.r2.dev/icons/calisma-masasi.png",
          modelUrl: "https://pub-a3ce010822b64aaaaea5e17cb19ef77b.r2.dev/models/calisma-masasi.glb",
        },

        parametric: true,

        basePrice: 0,

        dimensions: {
          defaultWidth: 120,
          defaultHeight: 75,
          defaultDepth: 60,

          minWidth: 80,
          maxWidth: 200,

          minHeight: 70,
          maxHeight: 80,

          minDepth: 50,
          maxDepth: 90,
        },

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

        dimensions: {
          defaultWidth: 90,
          defaultHeight: 180,
          defaultDepth: 30,

          minWidth: 60,
          maxWidth: 200,

          minHeight: 100,
          maxHeight: 240,

          minDepth: 25,
          maxDepth: 40,
        },

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

        dimensions: {
          defaultWidth: 100,
          defaultHeight: 90,
          defaultDepth: 45,

          minWidth: 60,
          maxWidth: 160,

          minHeight: 70,
          maxHeight: 110,

          minDepth: 40,
          maxDepth: 55,
        },

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

        // NOT: dimensions şu an 0/0/0 ve isActive false — üründe henüz ikon/model
        // yüklenmemiş (CDN'de dosya yok), CMS üzerinden canlıda bu şekilde yarım
        // bırakılmış durumda. Seed, canlı DB'nin mevcut halini birebir yansıtıyor;
        // tamamlanınca burası da güncellenmeli.
        dimensions: {
          defaultWidth: 0,
          defaultHeight: 0,
          defaultDepth: 0,

          minWidth: 50,
          maxWidth: 120,

          minHeight: 70,
          maxHeight: 110,

          minDepth: 30,
          maxDepth: 50,
        },

        allowedMaterials: [
          matBySlug["mdf-lam"],
          matBySlug["mdf-lake"],
        ],

        isActive: false,
      },

      {
        name: "Tek Kapaklı Komodin",

        slug: "tek-kapakli",

        category: categories[3]._id,

        description: "",

        assets: {
          icon: "https://cdn.eycestudio.com/icons/tek-kapakli.png",
          modelUrl: "https://cdn.eycestudio.com/models/tek-kapakli.glb",
        },

        parametric: true,

        basePrice: 6500,

        dimensions: {
          defaultWidth: 15,
          defaultHeight: 30,
          defaultDepth: 50,

          minWidth: 10,
          maxWidth: 20,

          minHeight: 20,
          maxHeight: 40,

          minDepth: 40,
          maxDepth: 60,
        },

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
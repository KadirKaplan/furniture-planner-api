require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const connectDB = require("../../config/db");
const Category = require("../models/Category");
const Material = require("../models/Material");
const Product = require("../models/Product");

const seed = async () => {
  await connectDB();
  console.log("🌱 Seed başlatılıyor...");

  // Temizle
  await Category.deleteMany({});
  await Material.deleteMany({});
  await Product.deleteMany({});

  // --- KATEGORİLER ---
const categories = await Category.insertMany([
  { name: "Dolap", slug: "dolap", order: 1, description: "Tekli ve çoklu dolaplar" },
  { name: "Masa", slug: "masa", order: 2, description: "Yemek, çalışma ve sehpa masaları" },
  { name: "Yatak Odası", slug: "yatak-odasi", order: 3, description: "Yatak çerçeveleri ve başlıklar" },
  { name: "Komodin", slug: "komodin", order: 4, description: "Komidinler" },
])
  console.log(`✅ ${categories.length} kategori eklendi`);

  // --- MALZEMELER ---
  const materials = await Material.insertMany([
    {
      name: "Meşe Ahşap",
      slug: "mese-ahsap",
      type: "wood",
      description: "Doğal meşe, sağlam ve uzun ömürlü",
      colors: [
        { name: "Açık Meşe", hex: "#C8A96E" },
        { name: "Koyu Meşe", hex: "#7B5E3A" },
        { name: "Antrasit Boyalı", hex: "#3C3C3C", priceModifier: 200 },
      ],
    },
    {
      name: "Ceviz Ahşap",
      slug: "ceviz-ahsap",
      type: "wood",
      description: "Premium ceviz, derin damar deseni",
      colors: [
        { name: "Doğal Ceviz", hex: "#5C3D1E" },
        { name: "Füme Ceviz", hex: "#3A2A18", priceModifier: 300 },
      ],
    },
    {
      name: "Keten Kumaş",
      slug: "keten-kumas",
      type: "fabric",
      description: "Doğal keten, nefes alır yapı",
      colors: [
        { name: "Krem", hex: "#F5F0E8" },
        { name: "Açık Gri", hex: "#C9C5BC" },
        { name: "Lacivert", hex: "#1C2B5E", priceModifier: 100 },
        { name: "Terrakota", hex: "#C0614A", priceModifier: 100 },
      ],
    },
    {
      name: "Kadife Kumaş",
      slug: "kadife-kumas",
      type: "fabric",
      description: "Yumuşak dokulu kadife, lüks görünüm",
      colors: [
        { name: "Zümrüt Yeşili", hex: "#2D6A4F" },
        { name: "Burgundy", hex: "#6B2737" },
        { name: "Gece Mavisi", hex: "#1A2744" },
        { name: "Altın Sarısı", hex: "#C9A84C", priceModifier: 200 },
      ],
    },
    {
      name: "Tam Deri",
      slug: "tam-deri",
      type: "leather",
      description: "İtalyan tam grain deri",
      colors: [
        { name: "Camel", hex: "#C19A6B" },
        { name: "Siyah", hex: "#1A1A1A" },
        { name: "Koyu Kahve", hex: "#3B1F0D" },
        { name: "Beyaz Krem", hex: "#F2EDE3", priceModifier: 500 },
      ],
    },
    {
      name: "Mat Metal",
      slug: "mat-metal",
      type: "metal",
      description: "Toz boyalı çelik ayaklar",
      colors: [
        { name: "Siyah Mat", hex: "#1C1C1C" },
        { name: "Beyaz Mat", hex: "#F0F0F0" },
        { name: "Altın", hex: "#D4AF37", priceModifier: 300 },
        { name: "Bakır", hex: "#B87333", priceModifier: 300 },
      ],
    },
  ]);
  console.log(`✅ ${materials.length} malzeme eklendi`);

  const matBySlug = {};
  materials.forEach((m) => (matBySlug[m.slug] = m._id));

  // --- ÜRÜNLER ---
  const products = await Product.insertMany([
    {
      name: "Modüler Dolap",
      slug: "moduler-dolap",
      category: categories[0]._id,
      description: "Genişletilebilir modüler tasarım, istediğiniz konfigürasyona göre düzenlenebilir",
      basePrice: 18500,
      currency: "TRY",
      isFeatured: true,
      allowedMaterials: [matBySlug["keten-kumas"], matBySlug["kadife-kumas"], matBySlug["tam-deri"]],
      tags: ["koltuk", "modüler", "köşe", "oturma odası"],
    },
    {
      name: "Mutfak Dolabı",
      slug: "mutfak-dolabi",
      category: categories[0]._id,
      description: "Mutfak Dolabı",
      basePrice: 7800,
      currency: "TRY",
      allowedMaterials: [matBySlug["keten-kumas"], matBySlug["kadife-kumas"], matBySlug["tam-deri"]],
      tags: ["berjer", "tekli", "koltuk"],
    },
    {
      name: "Yemek Masası",
      slug: "yemek-masasi",
      category: categories[1]._id,
      description: "Masif ahşap üst, seçilebilir metal veya ahşap ayak",
      basePrice: 12000,
      currency: "TRY",
      isFeatured: true,
      allowedMaterials: [matBySlug["mese-ahsap"], matBySlug["ceviz-ahsap"], matBySlug["mat-metal"]],
      tags: ["masa", "yemek", "ahşap"],
    },
    {
      name: "Çalışma Masası",
      slug: "calisma-masasi",
      category: categories[1]._id,
      description: "Kablo yönetimi ve gizli çekmeceli modern çalışma masası",
      basePrice: 8500,
      currency: "TRY",
      allowedMaterials: [matBySlug["mese-ahsap"], matBySlug["ceviz-ahsap"], matBySlug["mat-metal"]],
      tags: ["masa", "çalışma", "home office"],
    },
    {
      name: "Yatak Başlığı",
      slug: "dosemeli-yatak-basligi",
      category: categories[2]._id,
      description: "Yüksek yoğunluklu sünger, derin kapitone dikiş",
      basePrice: 5500,
      currency: "TRY",
      allowedMaterials: [matBySlug["keten-kumas"], matBySlug["kadife-kumas"], matBySlug["tam-deri"]],
      tags: ["yatak", "başlık", "yatak odası"],
    },
    {
      name: "Tek kişilik yatak",
      slug: "tek-kisilik-yatak",
      category: categories[2]._id,
      description: "Yüksek yoğunluklu sünger, derin kapitone dikiş",
      basePrice: 5500,
      currency: "TRY",
      allowedMaterials: [matBySlug["keten-kumas"], matBySlug["kadife-kumas"], matBySlug["tam-deri"]],
      tags: ["yatak", "başlık", "yatak odası"],
    },
    {
      name: "Çift kişilik yatak",
      slug: "cift-kisilik-yatak",
      category: categories[2]._id,
      description: "Yüksek yoğunluklu sünger, derin kapitone dikiş",
      basePrice: 5500,
      currency: "TRY",
      allowedMaterials: [matBySlug["keten-kumas"], matBySlug["kadife-kumas"], matBySlug["tam-deri"]],
      tags: ["yatak", "başlık", "yatak odası"],
    },

    {
      name: "Komodin",
      slug: "komodin",
      category: categories[3]._id,
      description: "Modüler sistem, dilediğiniz gibi birleştirilebilir",
      basePrice: 4200,
      currency: "TRY",
      allowedMaterials: [matBySlug["mese-ahsap"], matBySlug["ceviz-ahsap"]],
      tags: ["raf", "kitaplık", "depolama"],
    },
  ]);
  console.log(`✅ ${products.length} ürün eklendi`);

  console.log("\n🎉 Seed tamamlandı!");
  process.exit(0);
};

seed().catch((err) => {
  console.error("❌ Seed hatası:", err);
  process.exit(1);
});

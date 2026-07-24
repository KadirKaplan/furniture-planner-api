const mongoose = require("mongoose");
const applyIdTransform = require("../utils/idTransform");

/**
 * Basit, gizliliğe saygılı ziyaret istatistiği. Umami mantığı: çerez yok, IP saklanmaz.
 *
 * Bir "ziyaretçi", gün + tarayıcı + IP'nin GÜNLÜK DÖNEN bir hash'iyle temsil edilir
 * (bkz. analyticsController.collect). Ham IP asla yazılmaz — yalnızca geri çevrilemez
 * hash tutulur, o da her gün değiştiği için kişi zamanla takip edilemez. Bu, KVKK/GDPR
 * açısından çerezli/pixel'li klasik analitikten temiz kalmanın yoludur.
 *
 * (gün, ziyaretçiHash) ikilisi başına TEK belge tutulur (unique index + upsert): aynı
 * kişi gün içinde siteyi 10 kez açsa `hits` 10 olur ama satır bir tanedir. Böylece:
 *   tekil ziyaretçi = belge sayısı,  toplam ziyaret = hits toplamı.
 */
const visitSchema = new mongoose.Schema(
  {
    // "YYYY-MM-DD", Europe/Istanbul gününe göre (bkz. utils/analyticsTime.js).
    day: {
      type: String,
      required: true,
    },

    // sha256(ip + tarayıcı + salt + gün) — ham IP değil. Gün girdinin parçası
    // olduğu için hash her gün değişir; kişi günler arası eşleştirilemez.
    visitorHash: {
      type: String,
      required: true,
    },

    // ISO-2 ülke kodu (ör. "TR"), bilinmiyorsa "XX". Vercel/Cloudflare header'ından
    // çözülür; ilk görülüşte sabitlenir ($setOnInsert).
    country: {
      type: String,
      default: "XX",
    },

    // Bölge/şehir (header sağlıyorsa) ve ziyaretçinin ortamı — hepsi ilk görülüşte
    // sabitlenir ($setOnInsert), gün içinde değişmesi beklenmez.
    region: { type: String, default: null },
    city: { type: String, default: null },
    browser: { type: String, default: "Diğer" },
    os: { type: String, default: "Diğer" },
    device: { type: String, default: "desktop" },

    // Trafik kaynağı: yönlendiren sitenin ana adı (ör. "google.com") ya da doğrudan
    // giriş için "direct". Ham referrer URL'i değil, yalnızca host tutulur.
    referrer: { type: String, default: "direct" },

    // Bu ziyaretçinin o günkü toplam sayfa açılışı.
    hits: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Upsert bu ikiliye göre tekilleştirir — aynı ziyaretçi-gün için ikinci satır oluşmaz.
visitSchema.index({ day: 1, visitorHash: 1 }, { unique: true });

// Özet sorguları hep gün aralığına ve ülkeye göre gruplar.
visitSchema.index({ day: 1 });
visitSchema.index({ day: 1, country: 1 });

// Veri kendini temizler: ~13 ay sonra düşer. Ziyaret istatistiği süresiz saklanacak
// bir kayıt değil; koleksiyonun sınırsız büyümesini engeller (createdAt timestamps'ten).
visitSchema.index({ createdAt: 1 }, { expireAfterSeconds: 400 * 24 * 60 * 60 });

applyIdTransform(visitSchema);

module.exports = mongoose.model("Visit", visitSchema);

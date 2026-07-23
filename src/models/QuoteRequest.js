const mongoose = require("mongoose");
const applyIdTransform = require("../utils/idTransform");
const { QUOTE_STATUSES, DEFAULT_QUOTE_STATUS } = require("../config/quoteStatuses");

/**
 * Müşterinin planner'da tasarımını bitirip "Teklif Al" dediğinde düşen satış talebi.
 *
 * ── REVİZYON MODELİ ────────────────────────────────────────────────────────────
 * Bir teklif zamanla değişir: müşteri gönderir (v1), showroom'a gelir, birlikte
 * kapak stilini değiştirirsiniz (v2), fiyat güncellenir. Bu yüzden tasarım ve fiyat
 * teklifin KENDİSİNDE değil, append-only bir `revisions` dizisinde tutulur.
 *
 * Müşterinin ilk gönderimi de bir revizyondur (version 1, createdBy.kind="customer").
 * "Orijinal ayrı alanda, düzenlemeler ayrı dizide" şeklinde kurulsaydı her okuma
 * yerinde "revizyon var mı yok mu" diye dallanmak gerekirdi; simetrik model bunu
 * baştan yok ediyor.
 *
 * Dizi APPEND-ONLY'dir: geçmiş revizyon asla değiştirilmez veya silinmez, güncel
 * olan her zaman SONUNCUSUDUR. "Eski hale dön" bile eski revizyonun kopyasını yeni
 * bir revizyon olarak ekler. Böylece kayıt aynı zamanda bir denetim izidir —
 * müşteriye hangi aşamada hangi fiyatın verildiği geri dönülebilir şekilde durur.
 */

// Revizyon içindeki ürün satırı. Ürün/materyal/modül ADLARI ve fiyatlar o revizyon
// anında donar — CMS'ten ürün adı ya da basePrice değişse bile geçmiş revizyonlar
// müşteriye o gün söylenen fiyatı göstermeye devam eder. `product` yalnızca "hangi
// üründü" izini sürmek için; ürün silinmiş olabileceğinden görüntülemede kullanılmaz.
const quoteItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },

    productName: String,
    categorySlug: String,

    // cm cinsinden — planner metre kullanır, dönüşüm FE'de yapılır
    width: Number,
    height: Number,
    depth: Number,

    materialName: String,
    colorName: String,

    modules: [
      {
        _id: false,
        name: String,
        slug: String,
        // DİKKAT: `type: String` kısa yazımı BURADA KULLANILAMAZ. Mongoose bir nesnenin
        // içinde `type` anahtarı görünce onu "bu alanın tipi" bildirimi sanar, "type
        // adında bir alan" değil — sonuç olarak tüm modül nesnesini String'e indirger
        // ve dizi [String] olur. O hâlde modül satırı kaydedilirken CastError alınır
        // ("Cast to [string] failed ... at path modules.0"). İç içe biçim bu
        // belirsizliği ortadan kaldırıyor (aynı kalıp FurnitureModule.type'ta da var).
        type: { type: String },
        quantity: Number,
        unitPrice: Number,
        lineTotal: Number,
      },
    ],

    // Gövde fiyatı (modüller hariç) ve satırın toplamı
    bodyPrice: Number,
    finalPrice: Number,
  },
  { _id: false }
);

const revisionSchema = new mongoose.Schema(
  {
    // 1'den başlar, her yeni revizyonda artar
    version: {
      type: Number,
      required: true,
    },

    /**
     * Tasarımın YENİDEN ÇİZİLEBİLİR ham hali — items[] ile karıştırılmamalı:
     *   items[] → ticari kayıt (ne fiyat verildi), donmuş metin ve tutarlar
     *   design  → teknik kayıt (sahne nasıl kurulur): konum, kolon başına
     *             raf/çekmece dağılımı, kapak stilleri, duvar/zemin seçimi
     * items[] tek başına sahneyi KURAMAZ; design olmadan teklif yeniden açılamaz.
     *
     * Şema serbest (Mixed) çünkü içeriği planner'ın iç veri yapısıdır (FurnitureItem)
     * ve API'den bağımsız evrilir — alan alan doğrulansaydı planner'a eklenen her
     * özellik API değişikliği gerektirirdi. Bunun yerine içinde `version` taşır.
     */
    design: mongoose.Schema.Types.Mixed,

    items: [quoteItemSchema],

    // Oda ölçüleri (cm) — revizyonda değişebilir, o yüzden burada
    room: {
      width: Number,
      depth: Number,
      height: Number,
    },

    totalPrice: Number,

    // Bu revizyonun 3B sahne görüntüsü (R2 CDN URL'i)
    snapshotUrl: String,

    createdBy: {
      kind: {
        type: String,
        enum: ["customer", "admin"],
        default: "customer",
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      // Ad kopyalanır — kullanıcı sonradan silinse de revizyonu kimin yaptığı kalır
      name: String,
    },

    // "Showroom görüşmesi: kapak stili rustiğe çevrildi" gibi serbest not
    note: String,
  },
  {
    _id: false,
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const quoteRequestSchema = new mongoose.Schema(
  {
    // Müşteri bilgisi teklife aittir, revizyona değil — kişi değişmez
    customer: {
      fullName: {
        type: String,
        required: true,
        trim: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        trim: true,
        lowercase: true,
      },

      // 81 ilden biri (bkz. config/turkishProvinces.js) — zorunlu değil
      province: {
        type: String,
        trim: true,
      },

      note: {
        type: String,
        trim: true,
      },
    },

    revisions: [revisionSchema],

    /**
     * Aşağıdaki üç alan SON REVİZYONDAN TÜRETİLMİŞ kopyalardır — tek doğruluk kaynağı
     * her zaman revisions[son]'dur. Denormalize ediliyorlar çünkü liste ekranı yüzlerce
     * kaydı çeker ve her birinin tüm revizyon geçmişini (design blob'ları dahil) belleğe
     * almak gereksiz derecede pahalıdır; liste sorgusu revisions'ı select dışı bırakıp
     * bu alanları okur. Revizyon eklerken güncellenmeleri ZORUNLUDUR —
     * quoteRequestController.appendRevision bunu tek noktadan yapar.
     */
    currentVersion: {
      type: Number,
      default: 1,
    },

    totalPrice: Number,

    snapshotUrl: String,

    // Liste ekranında "kaç ürün" sütunu için — revisions yüklenmeden okunabilsin diye
    itemCount: Number,

    currency: {
      type: String,
      default: "TRY",
    },

    status: {
      type: String,
      enum: QUOTE_STATUSES,
      default: DEFAULT_QUOTE_STATUS,
      index: true,
    },

    // Admin'in kendi notu — müşterinin yazdığı customer.note'tan ayrı
    adminNote: String,
  },
  {
    timestamps: true,
  }
);

// Liste ekranı varsayılan olarak en yeniden eskiye sıralanır
quoteRequestSchema.index({ createdAt: -1 });

// Çift gönderim kontrolü (bkz. createQuoteRequest): "bu telefondan son X saniyede
// kayıt var mı" sorgusu her public teklifte çalışır, koleksiyon taraması olmasın.
quoteRequestSchema.index({ "customer.phone": 1, createdAt: -1 });

applyIdTransform(quoteRequestSchema);

module.exports = mongoose.model("QuoteRequest", quoteRequestSchema);

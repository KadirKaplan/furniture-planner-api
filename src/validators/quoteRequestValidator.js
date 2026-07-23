const { z } = require("zod");
const { objectId } = require("./common");
const { QUOTE_STATUSES } = require("../config/quoteStatuses");
const { TURKISH_PROVINCES } = require("../config/turkishProvinces");
const { normalizeTurkishPhone } = require("../utils/phone");

// Boş string gelen opsiyonel alanları undefined'a çevirir — form alanları
// doldurulmadığında FE boş string gönderir, DB'ye "" yazmanın anlamı yok.
const emptyToUndefined = (value) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

// design blob'unun üst sınırı (bkz. revisionPayloadShape.design)
const MAX_DESIGN_BYTES = 256 * 1024;

// Telefon: giriş biçimi serbest (0532 111 22 33 / +90 532 111 22 33 / 5321112233)
// ama saklanan değer daima E.164'e (+905321112233) çevrilir — aynı numaranın beş
// farklı yazımıyla beş ayrı kayıt oluşmasın, CMS'te aranabilir olsun.
// Doğrulama kuralları için bkz. utils/phone.js.
const phone = z
  .string()
  .trim()
  .min(1, "Telefon numarası zorunludur")
  .transform((val, ctx) => {
    const normalized = normalizeTurkishPhone(val);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "Geçerli bir telefon numarası giriniz" });
      return z.NEVER;
    }
    return normalized;
  });

const customerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Ad soyad zorunludur")
    .max(120, "Ad soyad çok uzun"),

  phone,

  email: z.preprocess(
    emptyToUndefined,
    z.string().trim().email("Geçerli bir e-posta giriniz").max(160).optional()
  ),

  // Kapalı liste — planner'daki dropdown ile aynı 81 il
  province: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .refine((val) => TURKISH_PROVINCES.includes(val), "Geçersiz il")
      .optional()
  ),

  note: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(2000, "Not çok uzun").optional()
  ),
});

// Fiyat client'tan alınmaz — yalnızca "ne seçildiği" gelir, tutarı sunucu hesaplar.
const quoteItemSchema = z.object({
  productId: objectId,
  width: z.number().positive(),
  height: z.number().positive(),
  depth: z.number().positive(),
  materialId: z.preprocess(emptyToUndefined, objectId.optional()),
  colorId: z.preprocess(emptyToUndefined, objectId.optional()),
  modules: z
    .array(
      z.object({
        moduleId: objectId,
        submoduleId: z.preprocess(emptyToUndefined, objectId.optional()),
        quantity: z.number().int().positive(),
      })
    )
    .optional(),
});

// Bir revizyonun gövdesi: tasarım + ürünler + oda + sahne görüntüsü. Müşterinin ilk
// gönderimi (v1) ve admin'in showroom'da oluşturduğu revizyonlar AYNI şekli kullanır —
// tek fark, ilkinde ayrıca customer bloğu gelir. İki ayrı şema yazılsaydı biri
// güncellenip diğeri unutulduğunda revizyonlar sessizce farklı doğrulanırdı.
const revisionPayloadShape = {
  room: z
    .object({
      width: z.number().positive().optional(),
      depth: z.number().positive().optional(),
      height: z.number().positive().optional(),
    })
    .optional(),

  items: z
    .array(quoteItemSchema)
    .min(1, "Teklif için en az bir ürün gereklidir")
    .max(50, "Tek teklifte en fazla 50 ürün olabilir"),

  // Tasarımın yeniden çizilebilir ham hali (bkz. QuoteRequest.design). İçerik
  // planner'ın iç yapısı olduğu için alan alan doğrulanmaz — aksi halde planner'a
  // eklenen her yeni özellik API'de de şema değişikliği isterdi. Yalnızca kabaca
  // şekli ve ÜST SINIRI kontrol edilir: doğrulanmamış serbest bir nesne, boyutu
  // sınırlanmazsa kayıt başına megabaytlarca çöp yazılabilecek bir kapıdır.
  design: z
    .object({
      version: z.number().int().positive(),
      wallId: z.string().max(120).nullable().optional(),
      floorId: z.string().max(120).optional(),
      furnitures: z.array(z.record(z.string(), z.unknown())).max(50),
    })
    // Dizi UZUNLUĞUNU sınırlamak tek başına yetmiyor: elemanlar doğrulanmamış
    // serbest nesneler, yani 50 kayıtlık bir dizi de megabaytlarca veri taşıyabilir.
    // Gerçek bir tasarım ~25 KB; 256 KB rahat bir tavan. Bu sınır olmadan
    // revizyonlar append-only olduğu için tek bir teklif Mongo'nun 16 MB doküman
    // sınırını aşıp BİR DAHA KAYDEDİLEMEZ hale gelebilirdi.
    .refine(
      (d) => Buffer.byteLength(JSON.stringify(d), "utf8") <= MAX_DESIGN_BYTES,
      "Tasarım verisi çok büyük"
    )
    .optional(),

  // "data:image/png;base64,..." biçiminde sahne görüntüsü. Controller bunu R2'ye
  // yükleyip yalnızca URL'i saklar; ham veri DB'ye hiç yazılmaz.
  snapshot: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(
        /^data:image\/(png|jpeg|webp);base64,/,
        "Snapshot yalnızca PNG, JPEG veya WEBP data URL olabilir"
      )
      .optional()
  ),
};

// Müşterinin planner'dan gönderdiği ilk talep — revizyon v1'i oluşturur.
const quoteRequestCreateSchema = z.object({
  customer: customerSchema,
  ...revisionPayloadShape,
});

// Admin'in showroom'da tasarımı düzenleyip kaydetmesi — mevcut teklife yeni bir
// revizyon ekler. Müşteri bilgisi burada YOK: kişi teklife ait, revizyona değil.
const quoteRevisionCreateSchema = z.object({
  ...revisionPayloadShape,
  note: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(500, "Revizyon notu çok uzun").optional()
  ),
});

// Admin yalnızca durumu ve kendi notunu değiştirebilir — müşteri bilgisi ve fiyat
// dökümü istek anındaki kanıt kaydıdır, sonradan düzenlenmemeli.
const quoteRequestUpdateSchema = z
  .object({
    status: z.enum(QUOTE_STATUSES).optional(),
    adminNote: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(2000).optional()
    ),
  })
  .refine(
    (data) => data.status !== undefined || data.adminNote !== undefined,
    "Güncellenecek bir alan gönderilmedi"
  );

module.exports = {
  quoteRequestCreateSchema,
  quoteRevisionCreateSchema,
  quoteRequestUpdateSchema,
};

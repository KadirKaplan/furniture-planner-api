// Modül DAVRANIŞ tipleri — kapalı küme, tek doğruluk kaynağı burası.
//
// Slug artık yalnızca kimlik/görüntüleme amaçlıdır; FE'nin 3D/etkileşim davranışı ve
// kategori kuralları bu enum üzerinden eşleşir. Admin CMS'te modüle istediği ismi/slug'ı
// verebilir ama tipi bu listeden seçmek zorundadır — böylece "whelf" gibi bir yazım
// hatası davranışı asla bozamaz.
//
// "generic": 3D davranışı olmayan, yalnızca adet × birim fiyat olarak fiyatlanan
// eklenti modüller (ör. askılık, aksesuar). Admin öngörmediğimiz bir modül eklerse
// güvenli çıkış kapısı budur. Yeni bir GERÇEK 3D davranışı (ör. gömme ayna) eklemek
// zaten FE'de kod gerektirir — o zaman bu listeye yeni değer eklenir.
const MODULE_TYPES = ["door", "drawer", "shelf", "mattress", "generic"];

module.exports = { MODULE_TYPES };

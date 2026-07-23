const rateLimit = require("express-rate-limit");

exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Çok fazla giriş denemesi yapıldı, lütfen 15 dakika sonra tekrar deneyin",
  },
});

// API'nin TEK genel tavanı: bir IP'nin 15 dakikada atabileceği toplam istek. Fiyat
// dahil tüm uçları kapsar — fiyat ucunun ayrı bir limiti yoktur, kötüye kullanıma
// karşı koruma tümüyle burasıdır.
//
// Fiyat, planner'da en sık tetiklenen istektir (her tasarım değişiminde bir batch);
// bu yüzden tavan, aktif bir konfigüratör oturumunun 15 dakikada üretebileceği
// yüzlerce fiyat + katalog isteğini rahatça kapsayacak kadar geniş tutulur (1000).
// Yine de tek bir IP'den saniyede ~1'lik sürekli bir hammer'ı sınırlar; asıl amaç bu.
// (Pahalı public uç olan teklif gönderiminin ayrıca kendi saatlik tavanı vardır.)
//
// Geliştirmede tamamen kapalı (bkz. quoteRequestLimiter'daki aynı gerekçe) — tek
// geliştirici planner'ı deneyerek tavanı kolayca aşar. Kapatma NODE_ENV'e bağlı,
// prod'da koruma yürürlükte kalır.
exports.globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== "production",
  message: {
    success: false,
    message: "Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin",
  },
});

// Teklif formu insan hızında doldurulur — saatte 5 gönderim gerçek bir müşteri için
// fazlasıyla yeterli, ama otomatik spam'in CMS'i çöp kayıtla doldurmasını engeller.
//
// Geliştirmede devre dışı: akışı test ederken arka arkaya 10-20 teklif göndermek
// normaldir ve 6.'da kilitlenmek testi durdurur. Kapatma NODE_ENV'e bağlı, yani
// prod'da limit her zaman yürürlükte — "test için geçici kapattım, açmayı unuttum"
// durumunun oluşamayacağı tek yöntem bu.
exports.quoteRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== "production",
  message: {
    success: false,
    message:
      "Çok fazla teklif talebi gönderildi, lütfen bir süre sonra tekrar deneyin",
  },
});

// Yukarıdaki limit IP başınadır ve dağıtık bir saldırıda hiçbir işe yaramaz:
// 1000 IP'den gelen 1000 istek, IP başına 5'in çok altında kalır ama Mongo'ya
// 1000 kayıt ve R2'ye gigabaytlarca görsel yazar. Bu yüzden public teklif ucunun
// bir de TOPLAM saatlik tavanı var.
//
// Tavana çarpmak normal işletmede olmayacak bir şeydir — dolduğunda kayıt kabul
// etmemek, depolamayı şişirip faturayı büyütmekten iyidir; ama gerçek bir kampanya
// günü meşru talepleri de keseceği için değeri env'den ayarlanabilir tutuyoruz.
exports.quoteRequestGlobalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.QUOTE_GLOBAL_HOURLY_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  // Tek kova: anahtar isteğe göre değişmiyor, tüm public teklif trafiği aynı sayaçta.
  keyGenerator: () => "quote-global",
  skip: () => process.env.NODE_ENV !== "production",
  // keyGenerator IP kullanmadığı için IPv6 doğrulaması anlamsız — kapatılmazsa
  // express-rate-limit her istekte uyarı basar.
  validate: { keyGeneratorIpFallback: false },
  message: {
    success: false,
    message:
      "Şu anda çok yoğun talep var, lütfen kısa bir süre sonra tekrar deneyin",
  },
});

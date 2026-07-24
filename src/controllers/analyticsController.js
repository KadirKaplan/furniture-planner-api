const crypto = require("crypto");
const Visit = require("../models/Visit");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../middleware/asyncHandler");
const { dayStr, daysAgoStr } = require("../utils/analyticsTime");
const { resolveGeo, clientIp } = require("../utils/geo");
const { parseUserAgent } = require("../utils/ua");

// Ham referrer URL'inden yalnızca kaynak host'unu çıkarır. Boşsa ya da kendi
// sitemizden geldiyse (iç gezinme/yenileme) "direct" sayılır — böylece "Kaynaklar"
// listesi gerçekten DIŞ trafiği gösterir, kendi domainimizi değil.
const SELF_HOSTS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => {
    try {
      return new URL(s.trim()).host;
    } catch {
      return null;
    }
  })
  .filter(Boolean);

const resolveReferrer = (raw) => {
  if (!raw || typeof raw !== "string") return "direct";
  try {
    const host = new URL(raw).host;
    if (!host || SELF_HOSTS.includes(host)) return "direct";
    // "www." önekini sadeleştir — google.com ve www.google.com aynı kaynak sayılsın.
    return host.replace(/^www\./, "").slice(0, 120);
  } catch {
    return "direct";
  }
};

// Ziyaretçi hash'inin gizli tuzu. Ayrı bir ANALYTICS_SALT verilebilir ama JWT_SECRET
// zaten sunucuda duran, dışarı sızmayan bir sır — varsayılan olarak ona düşüyoruz ki
// yeni env tanımlamadan çalışsın. Tuz olmadan hash, IP+UA'dan kaba kuvvetle geri
// çözülebilirdi; tuz bunu ve günlük döngü de kişinin günler arası takibini engeller.
const SALT = process.env.ANALYTICS_SALT || process.env.JWT_SECRET || "eyce-analytics";

/**
 * POST /api/analytics/collect — public (planner X-Client-Key ile çağırır).
 * Tek bir sayfa açılışını kaydeder. Yanıt gövdesiz (204): planner beacon'u yanıtı
 * beklemez, bu yüzden hızlı ve sessiz döneriz. Bir hata olursa bile istek asla
 * kullanıcının deneyimini etkilemez (planner .catch ile yutar).
 */
exports.collect = asyncHandler(async (req, res) => {
  const day = dayStr();
  const ua = req.headers["user-agent"] || "";
  const { country, region, city } = resolveGeo(req);
  const { browser, os, device } = parseUserAgent(ua);
  const referrer = resolveReferrer(req.body?.referrer);

  // Çerezsiz, geri çevrilemez günlük ziyaretçi kimliği (Umami mantığı). Ham IP asla
  // saklanmaz — yalnızca bu hash yazılır ve gün girdinin parçası olduğu için ertesi
  // gün tamamen değişir.
  const visitorHash = crypto
    .createHash("sha256")
    .update(`${clientIp(req)}|${ua}|${SALT}|${day}`)
    .digest("hex");

  // (gün, ziyaretçiHash) başına tek satır: aynı kişi gün içinde tekrar açarsa yalnızca
  // hits artar, yeni tekil ziyaretçi sayılmaz. Ortam/konum/kaynak ilk görülüşte
  // sabitlenir — aynı kişi için gün içinde değişmesi beklenmez.
  await Visit.updateOne(
    { day, visitorHash },
    {
      $inc: { hits: 1 },
      $setOnInsert: { country, region, city, browser, os, device, referrer },
    },
    { upsert: true }
  );

  return res.status(204).end();
});

// Bir gün aralığındaki toplam ziyaret (hits) ve TEKİL ziyaretçi (distinct hash)
// sayısını verir. Tekil sayısı günler arası toplanamaz (aynı kişi iki gün = 2 satır
// ama 1 kişi), bu yüzden aralık için ayrı bir distinct hesabı şart. toDay verilirse
// üst sınır dahil edilir (önceki-dönem karşılaştırması için kapalı aralık gerekir).
const rangeStats = async (fromDay, toDay) => {
  const dayFilter = { $gte: fromDay };
  if (toDay) dayFilter.$lte = toDay;
  const [row] = await Visit.aggregate([
    { $match: { day: dayFilter } },
    {
      $group: {
        _id: null,
        visits: { $sum: "$hits" },
        visitors: { $addToSet: "$visitorHash" },
      },
    },
    { $project: { _id: 0, visits: 1, visitors: { $size: "$visitors" } } },
  ]);
  return row || { visits: 0, visitors: 0 };
};

// Bir alana göre kırılım (son 30 gün): her değer için tekil ziyaretçi (distinct hash)
// ve toplam ziyaret. Ülke/bölge/şehir/tarayıcı/OS/cihaz/kaynak listelerinin hepsi
// aynı şekli döndürür — CMS tek bir liste bileşeniyle hepsini gösterir. null değerler
// (header sağlamayan bölge/şehir) "Bilinmiyor" grubunda toplanır.
const breakdown = (field, fromDay) =>
  Visit.aggregate([
    { $match: { day: { $gte: fromDay } } },
    {
      $group: {
        _id: { $ifNull: [`$${field}`, "Bilinmiyor"] },
        visits: { $sum: "$hits" },
        visitors: { $addToSet: "$visitorHash" },
      },
    },
    { $project: { _id: 0, key: "$_id", visits: 1, visitors: { $size: "$visitors" } } },
    { $sort: { visitors: -1, visits: -1 } },
  ]);

/**
 * GET /api/analytics/summary — admin. CMS "İstatistikler" ekranını besler:
 * toplamlar (+ önceki döneme göre değişim), 30 günlük günlük seri ve son 30 günün
 * ülke/bölge/şehir/tarayıcı/OS/cihaz/kaynak kırılımları.
 */
exports.summary = asyncHandler(async (req, res) => {
  const today = dayStr();
  const from7 = daysAgoStr(6); // bugün dahil 7 gün
  const from30 = daysAgoStr(29); // bugün dahil 30 gün
  // Önceki eşdeğer dönemler (Umami'deki % değişim için) — 7 günün öncesi [13..7]
  // gün, 30 günün öncesi [59..30] gün. Kapalı üst sınırla mevcut dönemle çakışmaz.
  const prev7From = daysAgoStr(13);
  const prev7To = daysAgoStr(7);
  const prev30From = daysAgoStr(59);
  const prev30To = daysAgoStr(30);

  const [
    totalsToday,
    totals7,
    totals30,
    totalsAll,
    prev7,
    prev30,
    daily,
    countries,
    regions,
    cities,
    browsers,
    operatingSystems,
    devices,
    sources,
  ] = await Promise.all([
      rangeStats(today),
      rangeStats(from7),
      rangeStats(from30),
      rangeStats("0000-00-00"),
      rangeStats(prev7From, prev7To),
      rangeStats(prev30From, prev30To),
      // Grafik: son 30 günün her günü. Gün başına tek-satır-per-ziyaretçi olduğundan
      // belge sayısı = o günün tekil ziyaretçisi, hits toplamı = o günün ziyareti.
      Visit.aggregate([
        { $match: { day: { $gte: from30 } } },
        {
          $group: {
            _id: "$day",
            visits: { $sum: "$hits" },
            visitors: { $sum: 1 },
          },
        },
        { $project: { _id: 0, day: "$_id", visits: 1, visitors: 1 } },
        { $sort: { day: 1 } },
      ]),
      breakdown("country", from30),
      breakdown("region", from30),
      breakdown("city", from30),
      breakdown("browser", from30),
      breakdown("os", from30),
      breakdown("device", from30),
      breakdown("referrer", from30),
    ]);

  return ApiResponse.success(res, {
    totals: {
      today: totalsToday,
      last7: totals7,
      last30: totals30,
      allTime: totalsAll,
    },
    // Önceki eşdeğer dönem — CMS bununla tile'larda ↑/↓ % değişimi gösterir.
    previous: {
      last7: prev7,
      last30: prev30,
    },
    daily,
    // Tüm kırılımlar { key, visits, visitors } şeklinde, ziyaretçiye göre azalan.
    countries,
    regions,
    cities,
    browsers,
    os: operatingSystems,
    devices,
    sources,
  });
});

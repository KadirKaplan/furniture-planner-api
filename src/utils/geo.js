// Ziyaretçinin konumunu ve (hash için) IP'sini isteğin proxy header'larından çözer.
// Proje Vercel'de, domain Cloudflare üzerinden geçiyor — her iki katman da konumu
// hazır header olarak ekler, bu yüzden GeoIP kütüphanesine gerek yok. Sıra önemli:
// Cloudflare proxy (turuncu bulut) açıksa isteği İLK o karşılar ve gerçek istemciye
// göre ölçer; değilse header hiç gelmez ve Vercel'inkine düşülür.

const first = (value) =>
  Array.isArray(value) ? value[0] : typeof value === "string" ? value.split(",")[0].trim() : undefined;

// Vercel şehir adını URL-encode eder (ör. "San%20Francisco"); güvenle çözer.
const decode = (v) => {
  if (!v) return undefined;
  try {
    return decodeURIComponent(v).trim() || undefined;
  } catch {
    return v.trim() || undefined;
  }
};

/**
 * { country, region, city } döner. country ISO-2 (bilinmiyorsa "XX"); region/city
 * header sağlıyorsa dolu, yoksa null. Cloudflare ücretsiz planı şehir vermez, Vercel
 * verir — hangisi varsa kullanılır, ikisi de yoksa null kalır (CMS "Bilinmiyor" gösterir).
 */
const resolveGeo = (req) => {
  const rawCountry =
    first(req.headers["cf-ipcountry"]) || first(req.headers["x-vercel-ip-country"]);
  let country = "XX";
  if (rawCountry) {
    const code = rawCountry.toUpperCase();
    if (code !== "T1" && code !== "XX" && code.length === 2) country = code;
  }

  const region =
    decode(first(req.headers["x-vercel-ip-country-region"])) ||
    decode(first(req.headers["cf-region-code"])) ||
    decode(first(req.headers["cf-region"])) ||
    null;

  const city =
    decode(first(req.headers["x-vercel-ip-city"])) ||
    decode(first(req.headers["cf-ipcity"])) ||
    null;

  return { country, region, city };
};

/**
 * İstemcinin IP'sini bulur — YALNIZCA ziyaretçi hash'i için stabil bir girdi olarak
 * kullanılır, hiçbir yere yazılmaz. Cloudflare gerçek IP'yi cf-connecting-ip'te taşır;
 * arkasında Vercel/başka proxy varsa x-forwarded-for'un ilk atlaması gerçek istemcidir.
 */
const clientIp = (req) =>
  first(req.headers["cf-connecting-ip"]) ||
  first(req.headers["x-forwarded-for"]) ||
  first(req.headers["x-real-ip"]) ||
  req.socket?.remoteAddress ||
  "";

module.exports = { resolveGeo, clientIp };

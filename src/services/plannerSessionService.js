const jwt = require("jsonwebtoken");

/**
 * Showroom oturumu — admin bir teklifi planner'da açmak istediğinde üretilen, kısa
 * ömürlü ve TEK BİR TEKLİFE kilitli yetki belgesi.
 *
 * Neden ayrı bir token: planner public bir uygulama, login'i yok ve admin JWT'sini
 * oraya taşımak (URL'de ya da localStorage'da) tüm CMS yetkisini tarayıcıya sızdırmak
 * olurdu. Bu token ise yalnızca "şu teklifin tasarımını oku ve üzerine revizyon yaz"
 * yetkisi taşır; başka bir teklife, başka bir uca ya da CMS'e geçmez.
 *
 * Ayrı bir `aud` kullanılır ("furniture-planner-session"): admin girişinin ürettiği
 * CMS token'ı ("furniture-planner-cms") bu uçlarda kabul EDİLMEZ ve tersi de geçerli
 * değildir — biri diğerinin yerine kullanılamaz.
 */
const AUDIENCE = "furniture-planner-session";
const ISSUER = "furniture-planner-api";

// Showroom'da masaya oturup tasarımı konuşmak için makul bir pencere. Süre dolarsa
// admin CMS'ten yeni bir bağlantı üretir — kalıcı bir paylaşım bağlantısı değildir.
const TTL_SECONDS = 2 * 60 * 60;

const signPlannerSession = ({ quoteId, user, version = null }) =>
  jwt.sign(
    {
      quoteId: String(quoteId),
      // Açılacak revizyon. null → o an güncel olan (son) revizyon. Token'a gömülür,
      // query string'den okunmaz: aksi halde planner'daki adresi elle değiştiren biri
      // aynı oturumla başka bir sürümü açabilirdi. Kaydetme yine de HER ZAMAN sona
      // ekler — v1 açılıp düzenlense bile sonuç yeni bir revizyondur, v1 değişmez.
      version,
      // Revizyonu kimin oluşturduğunu yazabilmek için token'a gömülür — planner
      // kendi başına "ben adminim" diyemez, bilgi imzalı belgeden gelir.
      adminId: String(user._id),
      adminName: user.name,
    },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: TTL_SECONDS,
      issuer: ISSUER,
      audience: AUDIENCE,
    }
  );

/**
 * @returns {{ ok: true, payload: object } | { ok: false, message: string }}
 */
const verifyPlannerSession = (token) => {
  if (!token) {
    return { ok: false, message: "Oturum anahtarı bulunamadı" };
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return { ok: true, payload };
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Oturumun süresi doldu, CMS'ten yeni bir bağlantı oluşturun"
        : "Geçersiz oturum anahtarı";
    return { ok: false, message };
  }
};

/**
 * Planner'ın çalıştığı adres. Ortama göre değişir; tanımlı değilse
 * ALLOWED_ORIGINS'in ilki kullanılır (yerel geliştirmede Vite sunucusu).
 */
const plannerBaseUrl = () => {
  const explicit = (process.env.PLANNER_URL || "").trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const firstOrigin = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)[0];

  return (firstOrigin || "http://localhost:5173").replace(/\/+$/, "");
};

module.exports = {
  signPlannerSession,
  verifyPlannerSession,
  plannerBaseUrl,
  PLANNER_SESSION_TTL_SECONDS: TTL_SECONDS,
};

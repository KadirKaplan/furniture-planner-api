/**
 * Türkiye telefon numarası normalizasyonu.
 *
 * Eski kural "rakamları ayıklandığında 10–13 hane" idi; bu, numaranın sonuna
 * fazladan hane eklenmiş girdileri (örn. 11 haneli bir GSM'e bir hane daha) ve
 * hiçbir operatöre karşılık gelmeyen önekleri kabul ediyordu. Aranamayan bir
 * numarayla gelen lead, gelmeyen lead kadar değersiz olduğu için hane sayısını
 * tam olarak sabitliyoruz.
 *
 * Kabul edilen girdiler (ayırıcılar serbest: boşluk, -, ., (, )):
 *   5321112233, 05321112233, +905321112233, 00905321112233, 905321112233
 *   2121112233 (sabit hat)
 *
 * Ulusal biçim daima 10 hanedir ve ilk hane:
 *   5 → GSM,  2/3/4 → sabit hat.
 * (0 ve 1 ile başlayan ulusal numara yoktur; 1xx kısa servis numaralarıdır.)
 */

// "+" yalnızca en başta olabilir; geri kalanı rakam ve görsel ayırıcılardan ibaret.
const ALLOWED_SHAPE = /^\+?[\d\s().-]+$/;

/**
 * @param {unknown} raw
 * @returns {string|null} E.164 biçiminde numara (+905321112233) veya geçersizse null
 */
function normalizeTurkishPhone(raw) {
  if (typeof raw !== "string") return null;

  const trimmed = raw.trim();
  if (!trimmed || !ALLOWED_SHAPE.test(trimmed)) return null;

  let digits = trimmed.replace(/\D/g, "");

  // Ülke kodunu soy: 0090… / 90… / 0…
  if (digits.startsWith("0090")) digits = digits.slice(4);
  else if (digits.length === 12 && digits.startsWith("90")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);

  if (digits.length !== 10) return null;
  if (!/^[2-5]/.test(digits)) return null;

  return `+90${digits}`;
}

/** Normalize edilmiş numarayı okunur biçimde gösterir: +90 532 111 22 33 */
function formatTurkishPhone(e164) {
  const m = /^\+90(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(e164 || "");
  return m ? `+90 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : e164;
}

module.exports = { normalizeTurkishPhone, formatTurkishPhone };

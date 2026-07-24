// Ziyaret istatistiği günleri Europe/Istanbul'a göre bölünür — "bugün" showroom'un
// yerel gününü kastetmeli, sunucunun UTC gününü değil. Türkiye yaz saatini kaldırdı
// ve kalıcı olarak UTC+3'te; bu yüzden sabit +3 offset güvenli ve deterministiktir
// (Intl'e/kütüphaneye gerek yok).
const TZ_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Verilen anı (varsayılan: şimdi) "YYYY-MM-DD" İstanbul gününe çevirir. */
const dayStr = (date = new Date()) =>
  new Date(date.getTime() + TZ_OFFSET_MS).toISOString().slice(0, 10);

/** N gün önceki İstanbul gününün "YYYY-MM-DD" karşılığı (0 = bugün). */
const daysAgoStr = (n) => dayStr(new Date(Date.now() - n * 24 * 60 * 60 * 1000));

module.exports = { dayStr, daysAgoStr };

// User-Agent'tan tarayıcı / işletim sistemi / cihaz türünü çıkarır. Harici bir UA
// ayrıştırma kütüphanesi (ua-parser-js vb.) taşımaya değmez — istatistik için kaba
// kırılım yeterli, o yüzden basit ve öngörülebilir kalıplarla eşleştiriyoruz.
//
// Sıra önemlidir: Edge/Opera/Samsung kendilerini "Chrome" gibi de tanıttığı için
// onları Chrome'dan ÖNCE; Chrome'u da Safari'den önce yakalamak gerekir.

const parseUserAgent = (uaRaw) => {
  const ua = uaRaw || "";

  // Cihaz türü
  let device = "desktop";
  if (/\b(iPad|Tablet)\b|Android(?!.*Mobile)/i.test(ua)) device = "tablet";
  else if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua)) device = "mobile";

  // İşletim sistemi
  let os = "Diğer";
  if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X|Macintosh/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  // Tarayıcı (sıra kritik)
  let browser = "Diğer";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/SamsungBrowser/i.test(ua)) browser = "Samsung Internet";
  else if (/Chrome\/|CriOS/i.test(ua)) browser = "Chrome";
  else if (/Firefox\/|FxiOS/i.test(ua)) browser = "Firefox";
  else if (/Safari/i.test(ua)) browser = "Safari";

  return { browser, os, device };
};

module.exports = { parseUserAgent };

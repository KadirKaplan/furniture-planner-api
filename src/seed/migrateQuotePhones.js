require("dotenv").config({
  path: require("path").join(__dirname, "../../.env"),
});

const connectDB = require("../config/db");
const QuoteRequest = require("../models/QuoteRequest");
const { normalizeTurkishPhone } = require("../utils/phone");

// customer.phone artık E.164 (+905321112233) olarak saklanıyor (bkz. utils/phone.js).
// Eski kayıtlar müşterinin yazdığı ham biçimde ("0532 111 22 33", "532-111-2233")
// duruyor; CMS'teki telefon araması tek bir biçime göre kurulduğu için bunlar
// normalize edilmeli. Idempotent: zaten normal olan kayıtlara dokunmaz.
//
// Eski doğrulama 10–13 hane kabul ettiğinden DB'de artık geçersiz sayılan
// numaralar olabilir (fazladan hane, geçersiz önek). Bunlar SESSİZCE SİLİNMEZ —
// müşterinin bıraktığı tek iletişim bilgisi olabilir; olduğu gibi bırakılıp
// raporlanır ki showroom elle düzeltebilsin.
const migrate = async () => {
  try {
    await connectDB();

    console.log("🔧 Teklif telefonu migration'ı başlıyor...");

    const quotes = await QuoteRequest.find({}, { "customer.phone": 1 }).lean();

    let normalized = 0;
    let already = 0;
    const invalid = [];

    for (const q of quotes) {
      const raw = q.customer?.phone;
      if (!raw) continue;

      const e164 = normalizeTurkishPhone(raw);
      if (!e164) {
        invalid.push({ id: String(q._id), phone: raw });
        continue;
      }
      if (e164 === raw) {
        already++;
        continue;
      }

      await QuoteRequest.updateOne({ _id: q._id }, { $set: { "customer.phone": e164 } });
      normalized++;
    }

    console.log(`✅ ${normalized} numara normalize edildi, ${already} zaten uygundu.`);

    if (invalid.length) {
      console.log(`⚠️  ${invalid.length} numara çözümlenemedi, dokunulmadı (elle düzeltin):`);
      invalid.forEach(({ id, phone }) => console.log(`   ${id}  ${JSON.stringify(phone)}`));
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Migration hatası:", err);
    process.exit(1);
  }
};

migrate();

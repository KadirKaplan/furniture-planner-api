/**
 * Teklif isteğinin satış hunisindeki durumu. Kapalı küme — CMS'teki durum seçici ve
 * API validator'ı bu listeden beslenir (bkz. furniture-planner-cms/src/lib/quoteStatuses.ts,
 * aynı değerlerin birebir kopyası). Yeni bir durum eklenecekse iki dosya birlikte
 * güncellenmeli, yoksa CMS bilinmeyen bir değeri etiketsiz gösterir.
 */
const QUOTE_STATUSES = ["yeni", "inceleniyor", "arandi", "tamamlandi", "iptal"];

const DEFAULT_QUOTE_STATUS = "yeni";

module.exports = { QUOTE_STATUSES, DEFAULT_QUOTE_STATUS };

const ApiResponse = require("../utils/apiResponse");
const { computePrice, loadModuleCategoryRules } = require("../services/pricingService");

// Tek batch isteğinde fiyatlanabilecek en fazla ürün — teklifteki 50 ürün sınırıyla
// aynı (bkz. quoteRequestValidator). Sınırsız bırakmak, tek istekle 10.000 ürün
// göndererek 10.000 DB sorgusu tetiklemenin kapısı olurdu.
const MAX_BATCH_ITEMS = 50;

/**
 * Fiyatlama formülünün tamamı services/pricingService.js içindedir — bu controller
 * yalnızca HTTP sözleşmesini (body → sonuç/hata yanıtı) kurar. Aynı çekirdeği teklif
 * isteği kaydı da kullanır, böylece iki uçta fiyat mantığı ayrışamaz.
 */
const calculatePrice = async (req, res) => {
  const result = await computePrice(req.body);

  if (!result.ok) {
    return ApiResponse.error(res, result.message, result.status);
  }

  return ApiResponse.success(res, result.data);
};

/**
 * POST /pricing/calculate-batch — bir tasarımdaki tüm ürünleri TEK istekte fiyatlar.
 *
 * Planner'daki canlı fiyat gösterimi eskiden her ürün için ayrı /calculate çağırıyordu;
 * 10 ürünlü bir sahnede bu, her düzenlemede 10 istek demekti ve genel istek tavanını
 * (globalLimiter) hızla tüketip bazı ürünlerin fiyatını "—" olarak boş bırakıyordu.
 * Batch ile istek sayısı ürün sayısından bağımsız olarak 1'e iner.
 *
 * Her ürün BAĞIMSIZ değerlendirilir: biri geçersizse (ör. ölçü sınır dışı) diğerleri
 * yine fiyatlanır ve o ürün için hata satırı döner — tek bozuk ürün tüm listeyi
 * "—" yapmasın.
 */
const calculatePriceBatch = async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : null;

  if (!items || items.length === 0) {
    return ApiResponse.error(res, "items dizisi zorunludur", 400);
  }
  if (items.length > MAX_BATCH_ITEMS) {
    return ApiResponse.error(
      res,
      `Tek istekte en fazla ${MAX_BATCH_ITEMS} ürün fiyatlanabilir`,
      400
    );
  }

  // Kural setini bir kez oku, her ürün için ayrı Setting sorgusu atma.
  const moduleCategoryRules = await loadModuleCategoryRules();

  const results = await Promise.all(
    items.map(async (item) => {
      const result = await computePrice(item, { moduleCategoryRules });
      return result.ok
        ? { ok: true, data: result.data }
        : { ok: false, message: result.message };
    })
  );

  return ApiResponse.success(res, { results });
};

module.exports = { calculatePrice, calculatePriceBatch };

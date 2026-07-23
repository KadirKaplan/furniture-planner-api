const crypto = require("crypto");
const QuoteRequest = require("../models/QuoteRequest");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("../middleware/asyncHandler");
const { computePrice, loadModuleCategoryRules } = require("../services/pricingService");
const {
  putObject,
  publicUrlFor,
  deleteObject,
  keyFromPublicUrl,
} = require("../services/storageService");
const {
  signPlannerSession,
  verifyPlannerSession,
  plannerBaseUrl,
  PLANNER_SESSION_TTL_SECONDS,
} = require("../services/plannerSessionService");
const { QUOTE_STATUSES } = require("../config/quoteStatuses");

// Sahne görüntüsü için üst sınır (çözülmüş hali). Planner ~1600px'lik bir PNG
// üretiyor; 6 MB bunun rahatça üstünde ama base64 bombasını da engelliyor.
const SNAPSHOT_MAX_BYTES = 6 * 1024 * 1024;

// Aynı numaradan bu süre içinde gelen ikinci talep, çift gönderim sayılır
// (bkz. createQuoteRequest).
const DUPLICATE_WINDOW_MS = 60 * 1000;

const SNAPSHOT_EXT = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/**
 * "data:image/png;base64,AAAA..." → R2'ye yükler, public URL döner.
 * Yükleme başarısız olursa null döner — çağıran taraf revizyonu yine de kaydeder
 * (asıl değerli veri tasarım ve fiyat; görsel kaybı işi durdurmamalı).
 */
const uploadSnapshot = async (dataUrl, quoteId, version) => {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/s.exec(dataUrl);
  if (!match) return null;

  const [, mimeType, base64] = match;
  const buffer = Buffer.from(base64, "base64");

  if (buffer.length === 0 || buffer.length > SNAPSHOT_MAX_BYTES) {
    console.warn(
      `[quote ${quoteId} v${version}] snapshot boyutu uygun değil (${buffer.length} bayt), atlanıyor`
    );
    return null;
  }

  // Anahtar SADECE teklif id'si + sürüm olamaz: Mongo ObjectId'nin son 3 baytı artan
  // bir sayaçtır, yani tek bir snapshot URL'ini gören biri sayacı artırarak diğer
  // müşterilerin tasarımlarını CDN'den sırayla çekebilirdi (bucket public okumaya
  // açık). Sonuna tahmin edilemez bir sonek ekliyoruz; id ve sürümü de koruyoruz ki
  // bucket'a bakınca dosyanın hangi teklifin hangi revizyonuna ait olduğu okunabilsin.
  const suffix = crypto.randomBytes(16).toString("hex");
  const key = `quotes/${quoteId}-v${version}-${suffix}.${SNAPSHOT_EXT[mimeType]}`;

  try {
    await putObject(key, buffer, mimeType);
    return publicUrlFor(key);
  } catch (error) {
    console.error(
      `[quote ${quoteId} v${version}] snapshot R2'ye yüklenemedi:`,
      error.message
    );
    return null;
  }
};

/**
 * Gelen ürün satırlarını SUNUCUDA fiyatlar. Fiyat client'tan asla alınmaz; istek
 * gövdesi düzenlenerek sahte tutarlı revizyon oluşturulamasın diye her satır
 * pricingService ile yeniden hesaplanır. Ürün/materyal/modül adları da hesabın
 * döndürdüğü güncel değerlerden kopyalanır — o revizyon anındaki hali kayıtta donar.
 *
 * @returns {{ ok: true, items: object[], totalPrice: number } | { ok: false, message, status }}
 */
const priceItems = async (items) => {
  // Kural setini bir kez oku — her ürün için ayrı Setting sorgusu atılmasın.
  const moduleCategoryRules = await loadModuleCategoryRules();

  const pricedItems = [];
  let totalPrice = 0;

  for (const [index, item] of items.entries()) {
    const result = await computePrice(item, { moduleCategoryRules });

    if (!result.ok) {
      return {
        ok: false,
        message: `${index + 1}. ürün fiyatlandırılamadı: ${result.message}`,
        status: result.status,
      };
    }

    const priced = result.data;

    pricedItems.push({
      product: priced.product.id,
      productName: priced.product.name,
      categorySlug: priced.categorySlug,
      width: item.width,
      height: item.height,
      depth: item.depth,
      materialName: priced.material?.name,
      colorName: priced.color?.name,
      modules: priced.modules.map((m) => ({
        name: m.name,
        slug: m.slug,
        type: m.type,
        quantity: m.quantity,
        unitPrice: m.unitPrice,
        lineTotal: m.lineTotal,
      })),
      bodyPrice: Math.round((priced.finalPrice - priced.modulesTotal) * 100) / 100,
      finalPrice: priced.finalPrice,
    });

    totalPrice += priced.finalPrice;
  }

  return { ok: true, items: pricedItems, totalPrice: Math.round(totalPrice * 100) / 100 };
};

/**
 * Mevcut bir teklife yeni revizyon ekler ve türetilmiş alanları (currentVersion,
 * totalPrice, snapshotUrl) günceller. revisions dizisi append-only olduğu için
 * geçmiş revizyonlara dokunulmaz.
 *
 * Türetilmiş alanların güncellenmesi BU FONKSİYONDA tek noktada yapılır — revizyon
 * ekleyen her yer bunu kendi başına yapsaydı biri unutulduğunda liste ekranı eski
 * fiyatı göstermeye devam ederdi ve fark edilmesi zor olurdu.
 */
const appendRevision = async (quoteRequest, { room, items, design, snapshot, note, createdBy }) => {
  const priced = await priceItems(items);
  if (!priced.ok) return priced;

  const version = (quoteRequest.revisions.at(-1)?.version ?? 0) + 1;

  quoteRequest.revisions.push({
    version,
    design,
    items: priced.items,
    room,
    totalPrice: priced.totalPrice,
    note,
    createdBy,
  });

  quoteRequest.currentVersion = version;
  quoteRequest.totalPrice = priced.totalPrice;
  quoteRequest.itemCount = priced.items.length;

  // Kayıt önce yazılır, snapshot sonra eklenir: R2 yüklemesi başarısız olsa bile
  // revizyon kaybolmaz (ve dosya adı için kaydın id'si gerekir).
  await quoteRequest.save();

  if (snapshot) {
    const snapshotUrl = await uploadSnapshot(snapshot, quoteRequest._id, version);
    if (snapshotUrl) {
      const revision = quoteRequest.revisions.at(-1);
      revision.snapshotUrl = snapshotUrl;
      quoteRequest.snapshotUrl = snapshotUrl;
      await quoteRequest.save();
    }
  }

  return { ok: true, version };
};

/**
 * POST /api/quote-requests — public (planner'dan X-Client-Key ile gelir).
 * Müşterinin ilk gönderimi; revizyon v1 olarak kaydedilir.
 */
exports.createQuoteRequest = asyncHandler(async (req, res) => {
  const { customer, room, items, design, snapshot } = req.body;

  // Çift gönderim kalkanı. Rate limit saatlik tavanı tutuyor ama asıl sık görülen
  // israf butona iki kez basılması ya da aynı isteğin tekrar oynatılması: her biri
  // ayrı bir Mongo kaydı ve ayrı bir R2 yüklemesi demek.
  //
  // Pencere bilerek kısa (60 sn): gerçek bir müşteri iki FARKLI tasarımı bir dakika
  // içinde göndermez, ama dakikalar sonra gönderebilir — pencereyi uzatmak meşru
  // ikinci talebi sessizce yutardı ve kaybedilen lead, çöp kayıttan pahalıdır.
  // Telefon bu noktada normalize edilmiş durumda (bkz. validator), yani aynı kişi
  // numarayı farklı yazarak kalkanı atlayamaz.
  const duplicate = await QuoteRequest.findOne({
    "customer.phone": customer.phone,
    createdAt: { $gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
  })
    .sort({ createdAt: -1 })
    .select("_id totalPrice currency");

  if (duplicate) {
    // Hata değil başarı dönüyoruz: müşteri açısından talebi zaten iletilmiş durumda,
    // "çok hızlı gönderdiniz" demek kafa karıştırır ve tekrar denemeye iter.
    return ApiResponse.success(
      res,
      {
        id: duplicate._id.toString(),
        totalPrice: duplicate.totalPrice,
        currency: duplicate.currency,
      },
      "Teklif talebiniz alındı",
      201
    );
  }

  const quoteRequest = new QuoteRequest({ customer, revisions: [] });

  const result = await appendRevision(quoteRequest, {
    room,
    items,
    design,
    snapshot,
    createdBy: { kind: "customer", name: customer.fullName },
  });

  if (!result.ok) {
    return ApiResponse.error(res, result.message, result.status);
  }

  // Public uçtan tüm kayıt geri dönmez — müşteriye yalnızca talebin alındığı bilgisi
  // ve hesaplanan tutar gösterilir.
  return ApiResponse.success(
    res,
    {
      id: quoteRequest._id.toString(),
      totalPrice: quoteRequest.totalPrice,
      currency: quoteRequest.currency,
    },
    "Teklif talebiniz alındı",
    201
  );
});

/**
 * GET /api/quote-requests — admin. status filtresi, isim/telefon/e-posta araması ve
 * sayfalama destekler. Revizyon geçmişi BİLEREK dışarıda bırakılır: liste yüzlerce
 * kaydı çeker ve her birinin design blob'larını taşımak gereksiz derecede pahalıdır.
 */
exports.getQuoteRequests = asyncHandler(async (req, res) => {
  const query = {};

  if (req.query.status && QUOTE_STATUSES.includes(req.query.status)) {
    query.status = req.query.status;
  }

  const search = (req.query.search || "").trim();
  if (search) {
    // Kullanıcı girdisi regex olarak yorumlanmadan önce kaçırılır — aksi halde
    // "(" gibi bir karakter sorguyu patlatır, ".*" ise tüm kayıtları tarar.
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(escaped, "i");
    query.$or = [
      { "customer.fullName": rx },
      { "customer.phone": rx },
      { "customer.email": rx },
    ];

    // Telefonlar E.164 olarak saklanır (+905321112233) ama admin numarayı
    // müşterinin söylediği gibi ("0532 111 22 33") yazar. Aramadaki rakamları
    // aynı ulusal biçime indirip ikinci bir kalıp ekliyoruz; aksi halde
    // baştaki 0 yüzünden hiçbir kayıt eşleşmiyordu.
    let digits = search.replace(/\D/g, "");
    if (digits.length >= 3) {
      if (digits.startsWith("0090")) digits = digits.slice(4);
      else if (digits.length === 12 && digits.startsWith("90")) digits = digits.slice(2);
      else if (digits.startsWith("0")) digits = digits.slice(1);
      // digits yalnızca rakamdan oluşur — regex kaçırma gerekmez.
      query.$or.push({ "customer.phone": new RegExp(digits) });
    }
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));

  const [quoteRequests, total] = await Promise.all([
    QuoteRequest.find(query)
      .select("-revisions")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    QuoteRequest.countDocuments(query),
  ]);

  return ApiResponse.success(res, {
    items: quoteRequests,
    total,
    page,
    limit,
    pageCount: Math.ceil(total / limit) || 1,
  });
});

exports.getQuoteRequest = asyncHandler(async (req, res) => {
  const quoteRequest = await QuoteRequest.findById(req.params.id);

  if (!quoteRequest) {
    return ApiResponse.error(res, "Teklif isteği bulunamadı", 404);
  }

  return ApiResponse.success(res, quoteRequest);
});

/**
 * POST /api/quote-requests/:id/revisions — admin. Showroom'da tasarım düzenlenip
 * kaydedildiğinde yeni bir revizyon ekler. Geçmiş revizyonlar değişmez.
 */
exports.createRevision = asyncHandler(async (req, res) => {
  const quoteRequest = await QuoteRequest.findById(req.params.id);

  if (!quoteRequest) {
    return ApiResponse.error(res, "Teklif isteği bulunamadı", 404);
  }

  const { room, items, design, snapshot, note } = req.body;

  const result = await appendRevision(quoteRequest, {
    room,
    items,
    design,
    snapshot,
    note,
    createdBy: { kind: "admin", user: req.user._id, name: req.user.name },
  });

  if (!result.ok) {
    return ApiResponse.error(res, result.message, result.status);
  }

  return ApiResponse.success(
    res,
    quoteRequest,
    `Revizyon v${result.version} oluşturuldu`,
    201
  );
});

exports.updateQuoteRequest = asyncHandler(async (req, res) => {
  const quoteRequest = await QuoteRequest.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!quoteRequest) {
    return ApiResponse.error(res, "Teklif isteği bulunamadı", 404);
  }

  return ApiResponse.success(res, quoteRequest, "Teklif isteği güncellendi");
});

exports.deleteQuoteRequest = asyncHandler(async (req, res) => {
  const quoteRequest = await QuoteRequest.findByIdAndDelete(req.params.id);

  if (!quoteRequest) {
    return ApiResponse.error(res, "Teklif isteği bulunamadı", 404);
  }

  // Kayıt gidince R2'deki sahne görüntüleri de silinir — HER revizyonun kendi görseli
  // var, yalnızca sonuncusu silinseydi eski revizyonların dosyaları bucket'ta yetim
  // kalırdı. Silme başarısız olursa isteği başarısız saymıyoruz: asıl işlem (kaydın
  // silinmesi) çoktan tamamlandı.
  const urls = quoteRequest.revisions
    .map((r) => r.snapshotUrl)
    .filter(Boolean);

  for (const url of urls) {
    const key = keyFromPublicUrl(url);
    if (!key) continue;
    try {
      await deleteObject(key);
    } catch (error) {
      console.error(
        `[quote ${quoteRequest._id}] snapshot R2'den silinemedi (${key}):`,
        error.message
      );
    }
  }

  return ApiResponse.success(res, null, "Teklif isteği silindi");
});

/**
 * GET /api/quote-requests/stats — admin. Dashboard/rozet için durum kırılımı.
 */
exports.getQuoteRequestStats = asyncHandler(async (req, res) => {
  const grouped = await QuoteRequest.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const byStatus = Object.fromEntries(QUOTE_STATUSES.map((s) => [s, 0]));
  let total = 0;

  for (const row of grouped) {
    if (row._id in byStatus) byStatus[row._id] = row.count;
    total += row.count;
  }

  return ApiResponse.success(res, { total, byStatus });
});

/* ── PLANNER SHOWROOM OTURUMU ──────────────────────────────────────────────────
 * Admin CMS'ten "Planner'da Aç" der → kısa ömürlü, tek teklife kilitli bir token
 * üretilir → planner o token'la tasarımı okur ve üzerine revizyon yazar.
 * Admin JWT'si planner'a hiç geçmez (bkz. services/plannerSessionService.js).
 */

/**
 * POST /api/quote-requests/:id/planner-session — admin. Açılacak bağlantıyı üretir.
 */
exports.createPlannerSession = asyncHandler(async (req, res) => {
  const quoteRequest = await QuoteRequest.findById(req.params.id);

  if (!quoteRequest) {
    return ApiResponse.error(res, "Teklif isteği bulunamadı", 404);
  }

  // ?version=2 verilmezse güncel (son) revizyon açılır. Verilirse gerçekten var
  // olduğu BURADA doğrulanır — bağlantı üretilirken hata vermek, admin müşterinin
  // karşısında boş bir sahneyle karşılaşmasından iyidir.
  let version = null;
  if (req.query.version !== undefined) {
    version = Number(req.query.version);
    const exists = quoteRequest.revisions.some((r) => r.version === version);
    if (!Number.isInteger(version) || !exists) {
      return ApiResponse.error(res, "Belirtilen revizyon bulunamadı", 404);
    }
  }

  const token = signPlannerSession({
    quoteId: quoteRequest._id,
    user: req.user,
    version,
  });

  return ApiResponse.success(res, {
    token,
    url: `${plannerBaseUrl()}/?session=${encodeURIComponent(token)}`,
    version: version ?? quoteRequest.currentVersion,
    expiresInSeconds: PLANNER_SESSION_TTL_SECONDS,
  });
});

// Oturum token'ını header'dan ya da query'den okur. Planner ilk yüklemede URL'den
// alır, sonraki isteklerinde header ile taşır.
const readSessionToken = (req) =>
  req.headers["x-planner-session"] || req.query.session || null;

const loadSessionQuote = async (req) => {
  const verified = verifyPlannerSession(readSessionToken(req));
  if (!verified.ok) return { ok: false, message: verified.message, status: 401 };

  const quoteRequest = await QuoteRequest.findById(verified.payload.quoteId);
  if (!quoteRequest) {
    return { ok: false, message: "Teklif isteği bulunamadı", status: 404 };
  }

  return { ok: true, quoteRequest, payload: verified.payload };
};

/**
 * GET /api/quote-requests/session — planner. Oturumun bağlı olduğu teklifin GÜNCEL
 * revizyonunun tasarımını döner. Müşteri iletişim bilgisi BİLEREK gönderilmez:
 * planner'ın tasarımı çizmek için telefona/e-postaya ihtiyacı yok, token da bir
 * tarayıcıda duruyor — gerekmeyen kişisel veri oraya hiç gitmemeli.
 */
exports.getPlannerSessionDesign = asyncHandler(async (req, res) => {
  const loaded = await loadSessionQuote(req);
  if (!loaded.ok) return ApiResponse.error(res, loaded.message, loaded.status);

  const { quoteRequest, payload } = loaded;

  // Token'da sürüm yazıyorsa o revizyon, yoksa güncel olan açılır. Sürüm token'dan
  // gelir (query'den değil) — imzalı olduğu için planner tarafında değiştirilemez.
  const latest = quoteRequest.revisions.at(-1);
  const target =
    payload.version != null
      ? quoteRequest.revisions.find((r) => r.version === payload.version)
      : latest;

  if (!target) {
    return ApiResponse.error(res, "Revizyon bulunamadı", 404);
  }

  return ApiResponse.success(res, {
    quoteId: quoteRequest._id.toString(),
    customerName: quoteRequest.customer.fullName,
    version: target.version,
    // Planner, eski bir sürümü açtığında kullanıcıyı uyarabilsin diye güncel sürümü
    // de bilir — kaydetme her hâlükârda sona eklenir, üzerine yazmaz.
    latestVersion: latest?.version ?? target.version,
    room: target.room ?? null,
    design: target.design ?? null,
    totalPrice: target.totalPrice ?? null,
  });
});

/**
 * POST /api/quote-requests/session/revisions — planner. Showroom'da yapılan
 * düzenlemeyi yeni revizyon olarak kaydeder. Revizyonu oluşturan admin, token'ın
 * içindeki imzalı kimlikten alınır — planner "ben şu adminim" diyemez.
 */
exports.createPlannerSessionRevision = asyncHandler(async (req, res) => {
  const loaded = await loadSessionQuote(req);
  if (!loaded.ok) return ApiResponse.error(res, loaded.message, loaded.status);

  const { quoteRequest, payload } = loaded;
  const { room, items, design, snapshot, note } = req.body;

  const result = await appendRevision(quoteRequest, {
    room,
    items,
    design,
    snapshot,
    note,
    createdBy: { kind: "admin", user: payload.adminId, name: payload.adminName },
  });

  if (!result.ok) {
    return ApiResponse.error(res, result.message, result.status);
  }

  return ApiResponse.success(
    res,
    {
      quoteId: quoteRequest._id.toString(),
      version: result.version,
      totalPrice: quoteRequest.totalPrice,
    },
    `Revizyon v${result.version} kaydedildi`,
    201
  );
});

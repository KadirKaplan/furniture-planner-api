const express = require("express");
const router = express.Router();

const {
  createQuoteRequest,
  getQuoteRequests,
  getQuoteRequest,
  updateQuoteRequest,
  deleteQuoteRequest,
  getQuoteRequestStats,
  createRevision,
  createPlannerSession,
  getPlannerSessionDesign,
  createPlannerSessionRevision,
} = require("../controllers/quoteRequestController");
const { protect, authorize } = require("../middleware/auth");
const { requireClientOrAuth } = require("../middleware/publicAccess");
const {
  quoteRequestLimiter,
  quoteRequestGlobalLimiter,
} = require("../middleware/rateLimiters");
const validate = require("../middleware/validate");
const {
  quoteRequestCreateSchema,
  quoteRevisionCreateSchema,
  quoteRequestUpdateSchema,
} = require("../validators/quoteRequestValidator");

// Oluşturma public (planner X-Client-Key ile gelir) ama okuma/güncelleme admin'e
// kapalı — teklif kayıtları müşteri kişisel verisi içerir, public uçtan listelenemez.
router
  .route("/")
  .get(protect, authorize("admin"), getQuoteRequests)
  .post(
    quoteRequestGlobalLimiter,
    quoteRequestLimiter,
    requireClientOrAuth,
    validate(quoteRequestCreateSchema),
    createQuoteRequest
  );

// Sabit yollar "/:id"den ÖNCE tanımlanmalı — aksi halde Express "stats"/"session"ı
// bir id sanıp getQuoteRequest'e yönlendirir ve CastError döner.
router.get("/stats", protect, authorize("admin"), getQuoteRequestStats);

// Planner showroom oturumu: admin JWT'si değil, imzalı ve tek teklife kilitli kısa
// ömürlü oturum token'ı ile doğrulanır (bkz. services/plannerSessionService.js).
// Kimlik denetimi controller içinde token doğrulanarak yapıldığı için burada
// protect YOK — bu uçlar admin JWT'siyle de çağrılamaz, yalnızca oturum token'ıyla.
router.get("/session", getPlannerSessionDesign);
router.post(
  "/session/revisions",
  validate(quoteRevisionCreateSchema),
  createPlannerSessionRevision
);

router
  .route("/:id")
  .get(protect, authorize("admin"), getQuoteRequest)
  .put(
    protect,
    authorize("admin"),
    validate(quoteRequestUpdateSchema),
    updateQuoteRequest
  )
  .delete(protect, authorize("admin"), deleteQuoteRequest);

router.post(
  "/:id/revisions",
  protect,
  authorize("admin"),
  validate(quoteRevisionCreateSchema),
  createRevision
);

router.post("/:id/planner-session", protect, authorize("admin"), createPlannerSession);

module.exports = router;

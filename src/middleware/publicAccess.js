const jwt = require("jsonwebtoken");
const ApiResponse = require("../utils/apiResponse");

/**
 * Bu endpoint'ler kimliksiz (public) katalog/fiyat uçları. Gerçek bir "sadece
 * furniture-planner'dan gelsin" garantisi tarayıcı dışı istemciler için mümkün
 * değil (client'a gömülen her şey Network sekmesinden kopyalanabilir) — bu yüzden
 * amaç Postman'i mutlak olarak engellemek değil, rate-limit + CORS ile birlikte
 * naif/otomatik erişimi zorlaştırmaktır. CMS'in kendi admin JWT'siyle gelen
 * istekleri de aynı endpoint'lerden geçtiği için JWT ile de geçişe izin veriyoruz.
 */
exports.requireClientOrAuth = (req, res, next) => {
  const clientKey = req.headers["x-client-key"];
  if (
    clientKey &&
    process.env.PLANNER_CLIENT_KEY &&
    clientKey === process.env.PLANNER_CLIENT_KEY
  ) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"],
        issuer: "furniture-planner-api",
        audience: "furniture-planner-cms",
      });
      return next();
    } catch (error) {
      // düş, aşağıda reddedilecek
    }
  }

  return ApiResponse.error(res, "Bu isteği yapmak için yetkiniz yok", 401);
};

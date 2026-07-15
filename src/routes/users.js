const express = require("express");
const router = express.Router();

const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  userCreateSchema,
  userUpdateSchema,
} = require("../validators/userValidator");

// Kullanıcı yönetimi tamamen dahili bir CMS özelliği — public/client-key erişimi yok,
// diğer kataloglardan (products/materials vb.) farklı olarak her uç nokta admin gerektirir.
router.use(protect, authorize("admin"));

router.route("/")
  .get(getUsers)
  .post(validate(userCreateSchema), createUser);

router.route("/:id")
  .get(getUser)
  .put(validate(userUpdateSchema), updateUser)
  .delete(deleteUser);

module.exports = router;

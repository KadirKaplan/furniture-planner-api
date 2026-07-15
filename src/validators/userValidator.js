const { z } = require("zod");

const userCreateSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  name: z.string().optional(),
  role: z.enum(["admin"]).optional(),
  isActive: z.boolean().optional(),
});

const userUpdateSchema = userCreateSchema.partial();

module.exports = { userCreateSchema, userUpdateSchema };

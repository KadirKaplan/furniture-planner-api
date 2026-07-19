const { z } = require("zod");

const colorSchema = z.object({
  name: z.string().optional(),
  hex: z.string().optional(),
  imageUrl: z.string().optional(),
  category: z.string().optional(),
  code: z.string().optional(),
  priceModifier: z.number().optional(),
});

const materialCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  type: z
    .enum(["mdflam", "mdflake", "glass", "metal", "supramat", "akrilik"])
    .optional(),
  description: z.string().optional(),
  // Materyal seviyesinde priceModifier kaldırıldı — fiyat etkisi ürün başına
  // Product.materialBasePrices ile yönetilir; zod bilinmeyen alanı zaten ayıklar.
  colors: z.array(colorSchema).optional(),
  isActive: z.boolean().optional(),
});

const materialUpdateSchema = materialCreateSchema.partial();

module.exports = { materialCreateSchema, materialUpdateSchema };

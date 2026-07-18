const { z } = require("zod");
const { MODULE_TYPES } = require("../config/moduleTypes");

const assetsSchema = z.object({
  icon: z.string().optional(),
  modelUrl: z.string().optional(),
});

const submoduleSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  slug: z.string().min(1),
  description: z.string().optional(),
  isCustom: z.boolean().optional(),
  assets: assetsSchema.optional(),
  swatchColor: z.string().optional(),
  swatchTextColor: z.string().optional(),
  priceModifier: z.number().optional(),
  isActive: z.boolean().optional(),
});

const moduleCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  // Davranış tipi kapalı kümeden seçilir — serbest metin değil (bkz. config/moduleTypes.js)
  type: z.enum(MODULE_TYPES),
  description: z.string().optional(),
  priceModifier: z.number().optional(),
  isCustom: z.boolean().optional(),
  assets: assetsSchema.optional(),
  swatchColor: z.string().optional(),
  swatchTextColor: z.string().optional(),
  submodules: z.array(submoduleSchema).optional(),
  isActive: z.boolean().optional(),
});

const moduleUpdateSchema = moduleCreateSchema.partial();

module.exports = { moduleCreateSchema, moduleUpdateSchema };

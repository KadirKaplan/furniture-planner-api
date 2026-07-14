const { z } = require("zod");

const moduleCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().min(1, "İkon zorunludur"),
  modelUrl: z.string().min(1, "3D model zorunludur"),
  type: z.enum(["generic", "door"]).optional(),
  priceModifier: z.number().optional(),
  isActive: z.boolean().optional(),
});

const moduleUpdateSchema = moduleCreateSchema.partial();

module.exports = { moduleCreateSchema, moduleUpdateSchema };

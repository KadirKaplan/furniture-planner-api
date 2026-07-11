const { z } = require("zod");

const moduleCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  priceModifier: z.number().optional(),
  isActive: z.boolean().optional(),
});

const moduleUpdateSchema = moduleCreateSchema.partial();

module.exports = { moduleCreateSchema, moduleUpdateSchema };

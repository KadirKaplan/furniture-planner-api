const { z } = require("zod");

const categoryCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
});

const categoryUpdateSchema = categoryCreateSchema.partial();

module.exports = { categoryCreateSchema, categoryUpdateSchema };

const { z } = require("zod");
const { objectId } = require("./common");

const dimensionsSchema = z.object({
  defaultWidth: z.number().positive("defaultWidth 0'dan büyük olmalıdır"),
  defaultHeight: z.number().positive("defaultHeight 0'dan büyük olmalıdır"),
  defaultDepth: z.number().positive("defaultDepth 0'dan büyük olmalıdır"),
  minWidth: z.number().positive("minWidth 0'dan büyük olmalıdır"),
  maxWidth: z.number().positive("maxWidth 0'dan büyük olmalıdır"),
  minHeight: z.number().positive("minHeight 0'dan büyük olmalıdır"),
  maxHeight: z.number().positive("maxHeight 0'dan büyük olmalıdır"),
  minDepth: z.number().positive("minDepth 0'dan büyük olmalıdır"),
  maxDepth: z.number().positive("maxDepth 0'dan büyük olmalıdır"),
});

const assetsSchema = z.object({
  icon: z.string().min(1, "İkon zorunludur"),
  modelUrl: z.string().min(1, "3D model zorunludur"),
});

const productCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  category: objectId,
  description: z.string().optional(),
  assets: assetsSchema,
  parametric: z.boolean().optional(),
  basePrice: z.number().min(0).optional(),
  dimensions: dimensionsSchema,
  // Tek kapağın maksimum genişliği (cm) — null/boş ise ürün kapak desteklemez
  maxDoorWidth: z.number().positive("maxDoorWidth 0'dan büyük olmalıdır").nullable().optional(),
  allowedMaterials: z.array(objectId).optional(),
  // Ürün başına materyal taban fiyatı override'ı (bkz. Product.materialBasePrices):
  // seçilen materyal listedeyse fiyat, product.basePrice yerine buradaki değerden
  // hesaplanır. Zod bilinmeyen alanları ayıkladığından burada tanımlı olması ŞART —
  // aksi halde CMS'in gönderdiği değer sessizce düşer ve kayıt kaybolur.
  materialBasePrices: z
    .array(
      z.object({
        material: objectId,
        basePrice: z.number().min(0, "basePrice negatif olamaz"),
      })
    )
    .optional(),
  availableColors: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

const productUpdateSchema = productCreateSchema.partial();

module.exports = { productCreateSchema, productUpdateSchema };

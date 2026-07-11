/**
 * Public API yanıtlarında Mongoose'un iç alanlarını (_id, __v) sızdırmamak için
 * şemaya uygulanan toJSON transformu. _id'nin yerine string bir "id" alanı konur.
 */
module.exports = function applyIdTransform(schema) {
  schema.set("toJSON", {
    versionKey: false,
    transform: (_doc, ret) => {
      if (ret._id !== undefined) {
        ret.id = ret._id.toString();
        delete ret._id;
      }
      delete ret.__v;
      return ret;
    },
  });
};

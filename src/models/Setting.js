const mongoose = require("mongoose");
const applyIdTransform = require("../utils/idTransform");

// Genel amaçlı key-value ayar koleksiyonu. Admin CMS üzerinden düzenleyemez —
// yalnızca DB'ye doğrudan (seed/migration script) müdahale ile değiştirilir.
// İlk kullanım: "moduleCategoryRules" — hangi modül (slug) hangi ürün kategorisinde
// (slug) kullanılabilir kuralı (bkz. seed/seed.js).
const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },

    value: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

applyIdTransform(settingSchema);

module.exports = mongoose.model("Setting", settingSchema);

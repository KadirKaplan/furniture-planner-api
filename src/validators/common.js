const { z } = require("zod");

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Geçersiz ID formatı");

module.exports = { objectId };

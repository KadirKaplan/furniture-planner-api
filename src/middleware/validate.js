const ApiResponse = require("../utils/apiResponse");

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
      .join("; ");
    return ApiResponse.error(res, message, 400);
  }

  req.body = result.data;
  next();
};

module.exports = validate;

import { HttpError } from "../utils/httpError.js";

/**
 * Middleware factory: validate req.body / req.query / req.params with a Zod schema.
 * @param {import("zod").ZodSchema} schema
 * @param {"body"|"query"|"params"} source
 */
export function validate(schema, source = "body") {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      const messages = issues.map(e => `${e.path.join(".")}: ${e.message}`).join("; ");
      return next(new HttpError(400, `Dữ liệu không hợp lệ: ${messages}`, issues));
    }
    req[source] = result.data;
    next();
  };
}

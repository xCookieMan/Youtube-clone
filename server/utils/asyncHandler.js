/**
 * Wraps an asynchronous Express route handler.
 * Automatically catches errors and forwards them to Express error-handling middleware.
 *
 * @template T
 * @param {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<T>} fn
 * @returns {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => void}
 *
 * @example
 * import { asyncHandler } from "../utils/asyncHandler.js";
 * router.get("/data", asyncHandler(async (req, res) => {
 *   const result = await getData();
 *   res.json(result);
 * }));
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

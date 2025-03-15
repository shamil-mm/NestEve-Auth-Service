import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import {
  AppError,
  NotFoundError,
  ValidationError,
  unauthorizedError,
} from "../error/AppError";
export const errorHandlerMiddleware: ErrorRequestHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = "statusCode" in err ? (err as AppError).statusCode : 500;
  console.error("Error:", {
    timestamp: new Date().toISOString(),
    message: err.message,
    // stack: err.stack,
    // path: req.path,
    method: req.method,
  });
  const errorResponse = {
    message: err.message || "Internal Server Error",
  };
  res.status(statusCode).json(errorResponse);
};

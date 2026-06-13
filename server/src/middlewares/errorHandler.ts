import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendServerError } from '../utils/response';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error(`Unhandled error: ${err.message}`, err.stack);
  sendServerError(res, process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message);
}
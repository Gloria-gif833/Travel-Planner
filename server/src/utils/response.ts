import { Response } from 'express';
import type { ApiResponse } from '../types';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400
) {
  const response: ApiResponse = {
    success: false,
    error: { code, message },
  };
  res.status(statusCode).json(response);
}

export function sendServerError(res: Response, message = '服务器内部错误') {
  sendError(res, 'INTERNAL_ERROR', message, 500);
}
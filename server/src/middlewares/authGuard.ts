import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';
import { sendError } from '../utils/response';

/**
 * JWT 认证中间件
 */
export function authGuard(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'UNAUTHORIZED', '请先登录', 401);
  }

  const token = authHeader.slice(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return sendError(res, 'TOKEN_INVALID', '登录已过期，请重新登录', 401);
  }

  (req as any).userId = decoded.userId;
  next();
}
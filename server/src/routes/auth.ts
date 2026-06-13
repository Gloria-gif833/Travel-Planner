import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validateRequest';
import { authGuard } from '../middlewares/authGuard';
import { registerUser, loginUser, getUserById } from '../services/authService';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

const router = Router();

// 注册验证
const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少 6 位'),
  name: z.string().optional(),
});

// 登录验证
const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
});

/**
 * POST /api/auth/register — 注册
 */
router.post(
  '/register',
  validateRequest(registerSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;
      const result = await registerUser(email, password, name || '');
      sendSuccess(res, result, 201);
    } catch (err) {
      const message = (err as Error).message;
      if (message.includes('已被注册')) {
        sendError(res, 'EMAIL_EXISTS', message, 409);
      } else {
        logger.error(`注册失败: ${message}`);
        sendError(res, 'REGISTER_FAILED', '注册失败，请重试', 500);
      }
    }
  }
);

/**
 * POST /api/auth/login — 登录
 */
router.post(
  '/login',
  validateRequest(loginSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const result = await loginUser(email, password);
      sendSuccess(res, result);
    } catch (err) {
      const message = (err as Error).message;
      if (message.includes('错误')) {
        sendError(res, 'INVALID_CREDENTIALS', message, 401);
      } else {
        logger.error(`登录失败: ${message}`);
        sendError(res, 'LOGIN_FAILED', '登录失败，请重试', 500);
      }
    }
  }
);

/**
 * GET /api/auth/me — 获取当前用户信息
 */
router.get('/me', authGuard, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const user = await getUserById(userId);
  if (!user) {
    return sendError(res, 'USER_NOT_FOUND', '用户不存在', 404);
  }
  sendSuccess(res, user);
});

export default router;
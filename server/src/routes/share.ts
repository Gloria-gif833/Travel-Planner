import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validateRequest';
import { authGuard } from '../middlewares/authGuard';
import {
  createShareLink,
  getSharedItinerary,
  getUserShareLinks,
  deleteShareLink,
} from '../services/shareService';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

const router = Router();

// 生成分享链接需要认证
const createSchema = z.object({
  itineraryId: z.string().min(1, '攻略 ID 不能为空'),
});

/**
 * POST /api/share — 生成分享链接（需认证）
 */
router.post(
  '/',
  authGuard,
  validateRequest(createSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const { itineraryId } = req.body;
      const result = await createShareLink(userId, itineraryId);
      sendSuccess(res, result, 201);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes('不存在')) {
        sendError(res, 'NOT_FOUND', msg, 404);
      } else {
        logger.error(`生成分享链接失败: ${msg}`);
        sendError(res, 'SHARE_ERROR', '生成分享链接失败', 500);
      }
    }
  }
);

/**
 * GET /api/share/:code — 通过短码获取攻略（公开，无需认证）
 */
router.get('/:code', async (req: Request, res: Response) => {
  try {
    const shortCode = req.params.code as string;
    const result = await getSharedItinerary(shortCode);

    if (!result) {
      return sendError(res, 'NOT_FOUND', '分享链接不存在', 404);
    }

    if (result.expired) {
      return sendError(res, 'EXPIRED', '分享链接已过期', 410);
    }

    sendSuccess(res, result);
  } catch (err) {
    logger.error(`获取分享攻略失败: ${(err as Error).message}`);
    sendError(res, 'GET_ERROR', '获取分享攻略失败', 500);
  }
});

/**
 * GET /api/share — 获取用户分享列表（需认证）
 */
router.get('/', authGuard, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const links = await getUserShareLinks(userId);
    sendSuccess(res, { items: links });
  } catch (err) {
    logger.error(`获取分享列表失败: ${(err as Error).message}`);
    sendError(res, 'LIST_ERROR', '获取分享列表失败', 500);
  }
});

/**
 * DELETE /api/share/:id — 删除分享链接（需认证）
 */
router.delete('/:id', authGuard, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const id = req.params.id as string;
    const deleted = await deleteShareLink(id, userId);
    if (!deleted) return sendError(res, 'NOT_FOUND', '分享链接不存在', 404);
    sendSuccess(res, { message: '删除成功' });
  } catch (err) {
    logger.error(`删除分享链接失败: ${(err as Error).message}`);
    sendError(res, 'DELETE_ERROR', '删除分享链接失败', 500);
  }
});

export default router;
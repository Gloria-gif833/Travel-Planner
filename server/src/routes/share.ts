import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validateRequest';
import {
  createShareLink,
  getSharedItinerary,
  getUserShareLinks,
  deleteShareLink,
} from '../services/shareService';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

const router = Router();

/** 从请求头读取访客 ID，缺失时返回错误 */
function getGuestId(req: Request): string {
  const guestId = req.headers['x-guest-id'] as string;
  if (!guestId) {
    throw new Error('GUEST_REQUIRED');
  }
  return guestId;
}

const createSchema = z.object({
  itineraryId: z.string().min(1, '攻略 ID 不能为空'),
});

/**
 * POST /api/share — 生成分享链接（需访客标识）
 */
router.post(
  '/',
  validateRequest(createSchema),
  async (req: Request, res: Response) => {
    try {
      const guestId = getGuestId(req);
      const { itineraryId } = req.body;
      const result = await createShareLink(guestId, itineraryId);
      sendSuccess(res, result, 201);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === 'GUEST_REQUIRED') {
        return sendError(res, 'GUEST_REQUIRED', '缺少访客标识', 400);
      }
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
 * GET /api/share — 获取用户分享列表（需访客标识）
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const guestId = getGuestId(req);
    const links = await getUserShareLinks(guestId);
    sendSuccess(res, { items: links });
  } catch (err) {
    const message = (err as Error).message;
    if (message === 'GUEST_REQUIRED') return sendError(res, 'GUEST_REQUIRED', '缺少访客标识', 400);
    logger.error(`获取分享列表失败: ${message}`);
    sendError(res, 'LIST_ERROR', '获取分享列表失败', 500);
  }
});

/**
 * DELETE /api/share/:id — 删除分享链接（需访客标识）
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const guestId = getGuestId(req);
    const id = req.params.id as string;
    const deleted = await deleteShareLink(id, guestId);
    if (!deleted) return sendError(res, 'NOT_FOUND', '分享链接不存在', 404);
    sendSuccess(res, { message: '删除成功' });
  } catch (err) {
    const message = (err as Error).message;
    if (message === 'GUEST_REQUIRED') return sendError(res, 'GUEST_REQUIRED', '缺少访客标识', 400);
    logger.error(`删除分享链接失败: ${message}`);
    sendError(res, 'DELETE_ERROR', '删除分享链接失败', 500);
  }
});

export default router;
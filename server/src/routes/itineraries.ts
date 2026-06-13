import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validateRequest';
import {
  getItinerariesList,
  getItineraryById,
  createItinerary,
  updateItinerary,
  deleteItinerary,
  getItineraryVersions,
  createVersionSnapshot,
} from '../services/itineraryService';
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
  title: z.string().min(1, '标题不能为空'),
  data: z.record(z.any()),
  summary: z.string().optional(),
});

const updateSchema = z.object({
  title: z.string().optional(),
  data: z.record(z.any()).optional(),
  summary: z.string().optional(),
});

// GET /api/itineraries
router.get('/', async (req: Request, res: Response) => {
  try {
    const guestId = getGuestId(req);
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await getItinerariesList(guestId, page, limit);
    sendSuccess(res, result);
  } catch (err) {
    const message = (err as Error).message;
    if (message === 'GUEST_REQUIRED') return sendError(res, 'GUEST_REQUIRED', '缺少访客标识', 400);
    logger.error(`获取攻略列表失败: ${message}`);
    sendError(res, 'LIST_ERROR', '获取攻略列表失败', 500);
  }
});

// GET /api/itineraries/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const guestId = getGuestId(req);
    const id = req.params.id as string;
    const itinerary = await getItineraryById(id, guestId);
    if (!itinerary) return sendError(res, 'NOT_FOUND', '攻略不存在', 404);
    sendSuccess(res, itinerary);
  } catch (err) {
    const message = (err as Error).message;
    if (message === 'GUEST_REQUIRED') return sendError(res, 'GUEST_REQUIRED', '缺少访客标识', 400);
    logger.error(`获取攻略详情失败: ${message}`);
    sendError(res, 'GET_ERROR', '获取攻略详情失败', 500);
  }
});

// POST /api/itineraries
router.post('/', validateRequest(createSchema), async (req: Request, res: Response) => {
  try {
    const guestId = getGuestId(req);
    const { title, data, summary } = req.body;
    const itinerary = await createItinerary({ guestId, title, data, summary });
    sendSuccess(res, itinerary, 201);
  } catch (err) {
    const message = (err as Error).message;
    if (message === 'GUEST_REQUIRED') return sendError(res, 'GUEST_REQUIRED', '缺少访客标识', 400);
    logger.error(`创建攻略失败: ${message}`);
    sendError(res, 'CREATE_ERROR', '创建攻略失败', 500);
  }
});

// PUT /api/itineraries/:id
router.put('/:id', validateRequest(updateSchema), async (req: Request, res: Response) => {
  try {
    const guestId = getGuestId(req);
    const id = req.params.id as string;
    const itinerary = await updateItinerary(id, guestId, req.body);
    if (!itinerary) return sendError(res, 'NOT_FOUND', '攻略不存在', 404);
    sendSuccess(res, itinerary);
  } catch (err) {
    const message = (err as Error).message;
    if (message === 'GUEST_REQUIRED') return sendError(res, 'GUEST_REQUIRED', '缺少访客标识', 400);
    logger.error(`更新攻略失败: ${message}`);
    sendError(res, 'UPDATE_ERROR', '更新攻略失败', 500);
  }
});

// DELETE /api/itineraries/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const guestId = getGuestId(req);
    const id = req.params.id as string;
    const deleted = await deleteItinerary(id, guestId);
    if (!deleted) return sendError(res, 'NOT_FOUND', '攻略不存在', 404);
    sendSuccess(res, { message: '删除成功' });
  } catch (err) {
    const message = (err as Error).message;
    if (message === 'GUEST_REQUIRED') return sendError(res, 'GUEST_REQUIRED', '缺少访客标识', 400);
    logger.error(`删除攻略失败: ${message}`);
    sendError(res, 'DELETE_ERROR', '删除攻略失败', 500);
  }
});

// GET /api/itineraries/:id/versions
router.get('/:id/versions', async (req: Request, res: Response) => {
  try {
    const guestId = getGuestId(req);
    const id = req.params.id as string;
    const versions = await getItineraryVersions(id, guestId);
    if (versions === null) return sendError(res, 'NOT_FOUND', '攻略不存在', 404);
    sendSuccess(res, { versions });
  } catch (err) {
    const message = (err as Error).message;
    if (message === 'GUEST_REQUIRED') return sendError(res, 'GUEST_REQUIRED', '缺少访客标识', 400);
    logger.error(`获取版本列表失败: ${message}`);
    sendError(res, 'VERSIONS_ERROR', '获取版本列表失败', 500);
  }
});

// POST /api/itineraries/:id/versions
router.post('/:id/versions', async (req: Request, res: Response) => {
  try {
    const guestId = getGuestId(req);
    const id = req.params.id as string;
    const { changeType, changeSummary } = req.body;
    const version = await createVersionSnapshot(
      id, guestId,
      changeType || 'manual',
      changeSummary || '手动创建版本快照'
    );
    if (!version) return sendError(res, 'NOT_FOUND', '攻略不存在', 404);
    sendSuccess(res, version, 201);
  } catch (err) {
    const message = (err as Error).message;
    if (message === 'GUEST_REQUIRED') return sendError(res, 'GUEST_REQUIRED', '缺少访客标识', 400);
    logger.error(`创建版本快照失败: ${message}`);
    sendError(res, 'SNAPSHOT_ERROR', '创建版本快照失败', 500);
  }
});

export default router;
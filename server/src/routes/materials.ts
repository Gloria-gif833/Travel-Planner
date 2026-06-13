import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validateRequest';
import { authGuard } from '../middlewares/authGuard';
import { uploadSingle } from '../middlewares/upload';
import {
  getMaterialsList,
  createTextMaterial,
  createImageMaterial,
  deleteMaterial,
} from '../services/materialService';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

const router = Router();
router.use(authGuard);

const textSchema = z.object({
  content: z.string().min(1, '内容不能为空'),
  itineraryId: z.string().optional(),
});

// GET /api/materials
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const itineraryId = req.query.itineraryId as string | undefined;
    const items = await getMaterialsList(userId, itineraryId);
    sendSuccess(res, { items });
  } catch (err) {
    logger.error(`获取素材列表失败: ${(err as Error).message}`);
    sendError(res, 'LIST_ERROR', '获取素材列表失败', 500);
  }
});

// POST /api/materials/upload
router.post('/upload', (req: Request, res: Response) => {
  uploadSingle(req, res, async (err) => {
    if (err) {
      return sendError(res, 'UPLOAD_ERROR', err.message, 400);
    }
    try {
      const userId = (req as any).userId as string;
      const file = req.file;
      if (!file) {
        return sendError(res, 'NO_FILE', '请选择要上传的文件', 400);
      }
      const fileUrl = `/uploads/${file.filename}`;
      const result = await createImageMaterial(userId, fileUrl, file.originalname);
      sendSuccess(res, result, 201);
    } catch (err2) {
      logger.error(`图片上传失败: ${(err2 as Error).message}`);
      sendError(res, 'UPLOAD_ERROR', '上传失败', 500);
    }
  });
});

// POST /api/materials/text
router.post('/text', validateRequest(textSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const { content, itineraryId } = req.body;
    const result = await createTextMaterial(userId, content, itineraryId);
    sendSuccess(res, result, 201);
  } catch (err) {
    logger.error(`文本素材保存失败: ${(err as Error).message}`);
    sendError(res, 'TEXT_ERROR', '保存失败', 500);
  }
});

// DELETE /api/materials/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const id = req.params.id as string;
    const deleted = await deleteMaterial(id, userId);
    if (!deleted) return sendError(res, 'NOT_FOUND', '素材不存在', 404);
    sendSuccess(res, { message: '删除成功' });
  } catch (err) {
    logger.error(`删除素材失败: ${(err as Error).message}`);
    sendError(res, 'DELETE_ERROR', '删除素材失败', 500);
  }
});

export default router;
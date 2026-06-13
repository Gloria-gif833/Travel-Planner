import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validateRequest';
import { callAi } from '../services/aiService';
import {
  ITINERARY_ADJUST_SYSTEM_PROMPT,
  buildAdjustUserPrompt,
} from '../services/promptTemplates';
import { parseItinerary } from '../services/itineraryParser';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

const router = Router();

// 请求体验证
const adjustSchema = z.object({
  itinerary: z.any(), // 当前攻略对象
  request: z.string().min(1, '调整需求不能为空'),
});

/**
 * POST /api/adjust — 攻略调整
 */
router.post(
  '/',
  validateRequest(adjustSchema),
  async (req: Request, res: Response) => {
    try {
      const { itinerary, request } = req.body;

      const currentItineraryStr = JSON.stringify(itinerary, null, 2);
      const userPrompt = buildAdjustUserPrompt(currentItineraryStr, request);

      const rawResult = await callAi(ITINERARY_ADJUST_SYSTEM_PROMPT, userPrompt, {
        maxTokens: 4096,
        temperature: 0.5,
        responseFormat: 'json_object',
      });

      const adjusted = parseItinerary(rawResult);

      logger.info(`攻略调整成功: ${request.slice(0, 30)}...`);

      sendSuccess(res, {
        itinerary: adjusted,
        raw: rawResult,
      });
    } catch (err) {
      logger.error(`攻略调整 API 错误: ${(err as Error).message}`);
      sendError(res, 'ADJUST_ERROR', '攻略调整失败，请稍后重试', 500);
    }
  }
);

export default router;
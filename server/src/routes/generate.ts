import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validateRequest';
import { callAi } from '../services/aiService';
import {
  ITINERARY_GENERATION_SYSTEM_PROMPT,
  buildGenerateUserPrompt,
} from '../services/promptTemplates';
import { getIntercityTransit, buildTransitInfoText } from '../services/travelTimeService';
import { parseItinerary } from '../services/itineraryParser';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

const router = Router();

// 请求体验证
const generateSchema = z.object({
  requirements: z.record(z.string()),
  materials: z
    .array(
      z.object({
        type: z.enum(['text', 'image']),
        content: z.string(),
      })
    )
    .optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.string(),
        content: z.string(),
      })
    )
    .optional(),
});

/**
 * POST /api/generate — 生成攻略
 */
router.post(
  '/',
  validateRequest(generateSchema),
  async (req: Request, res: Response) => {
    try {
      const { requirements, materials, conversationHistory } = req.body;

      // 如果有出发地和目的地，查询高德API获取实时交通时长
      let transitInfoText = '';
      const departure = requirements.departure || '';
      const destination = requirements.destination || '';
      if (departure && destination) {
        try {
          const transit = await getIntercityTransit(departure, destination);
          transitInfoText = buildTransitInfoText(departure, destination, transit);
          if (transit) {
            logger.info(`高德交通查询成功: ${departure}→${destination} ${transit.durationText} (${transit.recommendMode})`);
          }
        } catch (err) {
          logger.warn(`高德交通查询失败: ${(err as Error).message}`);
        }
      }

      const userPrompt = buildGenerateUserPrompt(requirements, materials, transitInfoText, conversationHistory);

      // 将关键数据注入 System Prompt（比 User Prompt 优先级更高）
      const systemPrompt = ITINERARY_GENERATION_SYSTEM_PROMPT({
        companions: requirements.companions,
        travelDate: requirements.travelDate,
        budget: requirements.budget,
      });

      const rawResult = await callAi(systemPrompt, userPrompt, {
        maxTokens: 8192,
        temperature: 0.7,
        responseFormat: 'json_object',
      });

      const itinerary = parseItinerary(rawResult);

      logger.info(`攻略生成成功: ${itinerary.title} (${itinerary.days.length}天)`);

      sendSuccess(res, {
        itinerary,
        raw: rawResult, // 调试用
      });
    } catch (err) {
      logger.error(`攻略生成 API 错误: ${(err as Error).message}`);
      sendError(res, 'GENERATE_ERROR', '攻略生成失败，请稍后重试', 500);
    }
  }
);

export default router;
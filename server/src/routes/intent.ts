import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validateRequest';
import { callAi } from '../services/aiService';
import {
  INTENT_EXTRACTION_SYSTEM_PROMPT,
  buildIntentExtractPrompt,
} from '../services/intentPrompt';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

const router = Router();

const intentSchema = z.object({
  request: z.string().min(1, '调整需求不能为空'),
  itinerarySummary: z.string().min(1, '攻略摘要不能为空'),
});

/**
 * POST /api/intent/extract — 意图提取
 * 轻量级接口：让 AI 理解用户自然语言指令，返回结构化 JSON
 */
router.post(
  '/extract',
  validateRequest(intentSchema),
  async (req: Request, res: Response) => {
    try {
      const { request, itinerarySummary } = req.body;
      const userPrompt = buildIntentExtractPrompt(request, itinerarySummary);

      const rawResult = await callAi(INTENT_EXTRACTION_SYSTEM_PROMPT, userPrompt, {
        maxTokens: 1024,
        temperature: 0.1,
        responseFormat: 'json_object',
      });

      // 尝试解析 JSON
      let intent;
      try {
        intent = JSON.parse(rawResult);
      } catch {
        logger.warn(`意图提取 JSON 解析失败: ${rawResult.slice(0, 100)}`);
        sendSuccess(res, {
          intent: 'unknown',
          confidence: 0,
          params: {},
          summary: '',
        });
        return;
      }

      logger.info(`意图提取成功: ${intent.intent || 'unknown'} (${intent.summary || ''})`);

      sendSuccess(res, {
        intent: intent.intent || 'unknown',
        confidence: intent.confidence || 0,
        params: intent.params || {},
        summary: intent.summary || '',
      });
    } catch (err) {
      logger.error(`意图提取 API 错误: ${(err as Error).message}`);
      sendSuccess(res, {
        intent: 'unknown',
        confidence: 0,
        params: {},
        summary: '',
      });
    }
  }
);

export default router;
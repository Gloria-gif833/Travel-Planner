import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validateRequest';
import { callAiStream } from '../services/aiService';
import { DEMAND_COLLECTION_SYSTEM_PROMPT } from '../services/promptTemplates';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

const router = Router();

// 请求体验证
const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ),
  context: z.record(z.string()).optional(),
});

/**
 * POST /api/chat — 对话采集（流式 SSE）
 */
router.post(
  '/',
  validateRequest(chatSchema),
  async (req: Request, res: Response) => {
    try {
      const { messages } = req.body;

      // 设置 SSE 响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      const fullContent: string[] = [];

      // 流式输出
      for await (const chunk of callAiStream(
        DEMAND_COLLECTION_SYSTEM_PROMPT,
        messages
      )) {
        fullContent.push(chunk);
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }

      // 流结束，发送完整内容
      res.write(`data: ${JSON.stringify({ done: true, fullContent: fullContent.join('') })}\n\n`);
      res.end();
    } catch (err) {
      logger.error(`聊天 API 错误: ${(err as Error).message}`);
      // 如果已经设置了 SSE 头，发送错误事件
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: 'AI 服务暂时不可用' })}\n\n`);
        res.end();
      } else {
        sendError(res, 'AI_ERROR', 'AI 服务暂时不可用，请稍后重试', 503);
      }
    }
  }
);

export default router;
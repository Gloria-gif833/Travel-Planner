import OpenAI from 'openai';
import { config } from '../config';
import { logger } from '../utils/logger';

/* ========================================
   AI 服务封装 — OpenAI SDK
   ======================================== */

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

let openaiClient: OpenAI | null = null;

function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!openaiClient) {
    // 如果是 Anthropic API key，使用兼容端点
    const baseURL = process.env.OPENAI_BASE_URL || undefined;
    openaiClient = new OpenAI({
      apiKey,
      baseURL,
    });
  }
  return openaiClient;
}

/**
 * 检查 AI 服务是否可用
 */
export function isAiAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 非流式 AI 对话（用于攻略生成和调整）
 */
export async function callAi(
  systemPrompt: string,
  userMessage: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
    responseFormat?: 'text' | 'json_object';
  }
): Promise<string> {
  const client = getClient();

  if (!client) {
    logger.warn('AI 服务未配置 API Key，使用 Mock 回复');
    return mockAiResponse(systemPrompt, userMessage);
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.7,
        response_format: options?.responseFormat === 'json_object'
          ? { type: 'json_object' }
          : undefined,
      });

      const content = response.choices[0]?.message?.content ?? '';
      // Token 统计
      if (response.usage) {
        logger.info(`AI 调用完成 — 输入: ${response.usage.prompt_tokens} tokens, 输出: ${response.usage.completion_tokens} tokens`);
      }
      return content;
    } catch (err) {
      lastError = err as Error;
      logger.warn(`AI 调用失败 (尝试 ${attempt}/${MAX_RETRIES}): ${(err as Error).message}`);
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY * attempt);
      }
    }
  }

  throw lastError || new Error('AI 调用失败');
}

/**
 * 流式 AI 对话（用于对话页实时展示）
 */
export async function* callAiStream(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): AsyncGenerator<string> {
  const client = getClient();

  if (!client) {
    logger.warn('AI 服务未配置 API Key，使用 Mock 流式回复');
    const mockText = mockAiResponse(systemPrompt, messages[messages.length - 1]?.content || '');
    // 模拟流式输出
    for (let i = 0; i < mockText.length; i += 5) {
      yield mockText.slice(i, i + 5);
      await sleep(30);
    }
    return;
  }

  try {
    const stream = await client.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ],
      max_tokens: options?.maxTokens ?? 2048,
      temperature: options?.temperature ?? 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      // DeepSeek 推理模型：先用 reasoning_content 输出思考过程，再输出 content
      // 我们只取实际的 content，跳过推理过程
      if (delta?.content) {
        yield delta.content;
      }
    }
  } catch (err) {
    logger.error(`流式 AI 调用失败: ${(err as Error).message}`);
    throw err;
  }
}

/* ========================================
   Mock AI 回复（API Key 未配置时的降级）
   ======================================== */

function mockAiResponse(_systemPrompt: string, userMessage: string): string {
  const input = userMessage.toLowerCase();

  // 攻略生成
  if (input.includes('生成攻略') || input.includes('generate')) {
    return mockGenerateItinerary();
  }

  // 攻略调整
  if (input.includes('调整') || input.includes('修改') || input.includes('添加') || input.includes('删除')) {
    return `根据你的需求，我已经调整了攻略内容。${mockAdjustItinerary(input)}`;
  }

  // 对话回复
  if (input.includes('成都') || input.includes('destination')) {
    return '成都好呀！一个来了就不想走的城市 🏙️ 大概玩几天呢？';
  }
  if (input.includes('天') && (input.match(/\d+/) || input.includes('几'))) {
    return '好的！那这次旅行大概预算是多少呢？（比如：5000-8000、1万-1.5万）💰';
  }
  if (input.includes('预算') || input.includes('钱') || input.includes('¥') || input.includes('元')) {
    return '明白了～是独自旅行、情侣出游、朋友结伴还是带家人一起去呢？👥';
  }
  if (input.includes('情侣') || input.includes('独自') || input.includes('朋友') || input.includes('家人') || input.includes('一个人') || input.includes('两个人')) {
    return '太棒了！你更喜欢什么类型的玩法？自然风光、美食探店、人文历史、购物休闲，还是都想要？🎯';
  }
  if (input.includes('自然') || input.includes('美食') || input.includes('人文') || input.includes('购物') || input.includes('都喜欢')) {
    return '完美！最后，住宿方面有什么偏好吗？比如民宿、酒店、青旅，或者对位置有要求？🏨';
  }
  if (input.includes('民宿') || input.includes('酒店') || input.includes('住宿')) {
    return '好的！你的需求我都记下啦 ✅\n\n你是否有查看过相关的旅游攻略或帖子是你比较感兴趣的？如果有的话可以上传一些素材，我能为你生成更精准的攻略哦 😊';
  }

  return '好的，我了解了！还有其他想告诉我的吗？😊';
}

function mockGenerateItinerary(): string {
  return JSON.stringify({
    title: '5天4夜 成都自由行攻略',
    days: [
      {
        dayNumber: 1,
        title: '经典市区游',
        date: '第 1 天',
        slots: [
          {
            label: '上午',
            spots: [
              {
                name: '成都大熊猫繁育研究基地',
                description: '近距离观看可爱的大熊猫，建议早上前往。',
                duration: '3小时',
                transport: { mode: '地铁', duration: '40分钟' },
                tags: ['景点'],
                recommendReason: '全球最大的大熊猫繁育基地，清晨熊猫最活跃，可以近距离观察国宝的日常生活，适合亲子游。',
                ticketInfo: { type: '收费', price: '55元/人' },
              },
            ],
          },
          {
            label: '下午',
            spots: [
              {
                name: '宽窄巷子',
                description: '成都最具代表性的历史文化街区。',
                duration: '2小时',
                transport: { mode: '地铁', duration: '30分钟' },
                tags: ['美食', '文化'],
              },
            ],
          },
          {
            label: '晚上',
            spots: [
              {
                name: '锦里古街',
                description: '夜晚的锦里灯火璀璨，品尝各种成都小吃。',
                duration: '2小时',
                transport: { mode: '打车', duration: '15分钟' },
                tags: ['美食', '夜景'],
              },
            ],
          },
        ],
        tips: ['建议早点出发去熊猫基地'],
      },
    ],
    practicalInfo: {
      transport: '成都地铁网络发达，覆盖主要景点。',
      accommodation: '建议住在春熙路/太古里附近。',
      budget: { transport: 2000, hotel: 1500, food: 800, tickets: 500, other: 400 },
    },
    notices: ['成都气候湿润，建议携带雨具', '部分景点需提前预约'],
  });
}

function mockAdjustItinerary(input: string): string {
  if (input.includes('添加') || input.includes('增加')) {
    return '已为你添加了新的景点到对应行程中。';
  }
  if (input.includes('删除') || input.includes('去掉')) {
    return '已根据你的要求移除了相应景点。';
  }
  if (input.includes('时间') || input.includes('延长')) {
    return '已调整了游玩时长。';
  }
  return '攻略已根据你的反馈进行了优化。';
}
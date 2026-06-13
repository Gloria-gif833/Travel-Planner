import apiClient from './apiClient';

/* ========================================
   对话 API 调用
   ======================================== */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  context?: Record<string, string>;
}

/**
 * 流式对话调用（使用 fetch + SSE）
 */
export async function* streamChat(
  messages: ChatMessage[],
  context?: Record<string, string>
): AsyncGenerator<string> {
  const token = localStorage.getItem('auth_token');

  const response = await fetch(`${apiClient.defaults.baseURL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      messages,
      context,
    } as ChatRequest),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || '对话请求失败');
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('无法读取响应流');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const event = JSON.parse(line.slice(6));
          if (event.content) yield event.content;
          if (event.error) throw new Error(event.error);
        } catch (err) {
          if (err instanceof SyntaxError) continue;
          throw err;
        }
      }
    }
  }
}
/* ========================================
   SSE 流式解析工具
   ======================================== */

export interface SseEvent {
  content?: string;
  done?: boolean;
  fullContent?: string;
  error?: string;
}

/**
 * 解析 SSE 事件流文本
 */
export function parseSseEvents(raw: string): SseEvent[] {
  const events: SseEvent[] = [];
  const lines = raw.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const data = JSON.parse(line.slice(6));
        events.push(data);
      } catch {
        // 忽略解析失败的行
      }
    }
  }

  return events;
}

/**
 * 从 fetch Response 中逐块读取 SSE 流
 */
export async function* readSseStream(
  response: Response
): AsyncGenerator<string> {
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // 按行处理
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event: SseEvent = JSON.parse(line.slice(6));
            if (event.content) {
              yield event.content;
            }
            if (event.error) {
              throw new Error(event.error);
            }
          } catch (err) {
            if (err instanceof SyntaxError) continue;
            throw err;
          }
        }
      }
    }

    // 处理最后的 buffer
    if (buffer.startsWith('data: ')) {
      try {
        const event: SseEvent = JSON.parse(buffer.slice(6));
        if (event.content) yield event.content;
      } catch { /* ignore */ }
    }
  } finally {
    reader.releaseLock();
  }
}
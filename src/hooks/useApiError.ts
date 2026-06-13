import { useCallback } from 'react';
import { useToast, type ToastType } from '../components/Toast/Toast';

/* ========================================
   useApiError Hook — API 错误处理
   ======================================== */

export function useApiError() {
  const { showToast } = useToast();

  const handleError = useCallback(
    (error: unknown, defaultMessage = '操作失败') => {
      const message = error instanceof Error ? error.message : defaultMessage;

      // 根据错误信息判断类型
      let type: ToastType = 'error';
      let displayMessage = message;

      if (message.includes('网络') || message.includes('连接失败') || message.includes('fetch')) {
        type = 'warning';
        displayMessage = '网络连接失败，请检查服务器是否运行';
      } else if (message.includes('超时')) {
        type = 'warning';
        displayMessage = '请求超时，请稍后重试';
      } else if (message.includes('429') || message.includes('限流')) {
        type = 'warning';
        displayMessage = '请求过于频繁，请稍后再试';
      } else if (message.includes('401') || message.includes('未登录') || message.includes('登录已过期')) {
        type = 'warning';
        displayMessage = '登录已过期，请重新登录';
      } else if (message.includes('500') || message.includes('服务器')) {
        type = 'error';
        displayMessage = '服务器内部错误，请稍后重试';
      }

      showToast(displayMessage, type);
      return displayMessage;
    },
    [showToast]
  );

  return { handleError };
}
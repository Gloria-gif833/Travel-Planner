import { useState, useCallback } from 'react';
import { generateShareLink, formatExpiryDate, type ShareLinkResult } from '../services/shareService';

/* ========================================
   useShare Hook
   ======================================== */

export function useShare() {
  const [shareResult, setShareResult] = useState<ShareLinkResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 生成分享链接
   */
  const createShareLink = useCallback(async () => {
    setGenerating(true);
    setError(null);
    setCopied(false);

    try {
      const result = await generateShareLink();
      setShareResult(result);
    } catch (err) {
      setError('生成分享链接失败，请重试');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  }, []);

  /**
   * 复制链接到剪贴板
   */
  const copyLink = useCallback(async () => {
    if (!shareResult) return;

    try {
      await navigator.clipboard.writeText(shareResult.url);
      setCopied(true);
      // 3 秒后重置复制状态
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // 降级：提示用户手动复制
      setError('复制失败，请手动复制链接');
    }
  }, [shareResult]);

  /**
   * 清空分享结果
   */
  const reset = useCallback(() => {
    setShareResult(null);
    setCopied(false);
    setError(null);
  }, []);

  return {
    shareResult,
    generating,
    copied,
    error,
    createShareLink,
    copyLink,
    reset,
  };
}
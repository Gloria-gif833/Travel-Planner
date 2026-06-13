import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useShare } from '../hooks/useShare';
import { formatExpiryDate } from '../services/shareService';
import styles from '../styles/share.module.css';

export default function SharePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromExport = searchParams.get('from') === 'export';

  const {
    shareResult,
    generating,
    copied,
    error,
    createShareLink,
    copyLink,
  } = useShare();

  // 自动生成分享链接
  useEffect(() => {
    if (fromExport) {
      createShareLink();
    }
  }, [fromExport, createShareLink]);

  // 如果不是从导出页来的，引导用户
  if (!fromExport) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <span className={styles.successIcon}>🔗</span>
          <h2 className={styles.title}>分享攻略</h2>
          <p className={styles.subtitle}>
            请先从攻略展示页导出文档，再生成分享链接
          </p>
          <div className={styles.actions}>
            <button
              className={`${styles.actionButton} ${styles.primaryButton}`}
              onClick={() => navigate('/itinerary')}
            >
              🗺 前往攻略
            </button>
            <button
              className={`${styles.actionButton} ${styles.secondaryButton}`}
              onClick={() => navigate('/')}
            >
              🏠 回到首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 生成中
  if (generating) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <span className={styles.loadingText}>正在生成分享链接...</span>
          </div>
        </div>
      </div>
    );
  }

  // 错误
  if (error && !shareResult) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <span className={styles.successIcon}>❌</span>
          <h2 className={styles.title}>生成失败</h2>
          <p className={styles.errorText}>{error}</p>
          <button className={styles.retryButton} onClick={createShareLink}>
            重新生成
          </button>
        </div>
      </div>
    );
  }

  // 成功
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <span className={styles.successIcon}>✅</span>
        <h2 className={styles.title}>分享链接已生成！</h2>
        <p className={styles.subtitle}>
          任何人可查看你的旅行攻略
        </p>

        {/* 链接框 */}
        <div className={styles.linkBox}>
          <span className={styles.linkText}>{shareResult?.url}</span>
          <button
            className={`${styles.copyButton} ${copied ? styles.copySuccess : styles.copyIdle}`}
            onClick={copyLink}
          >
            {copied ? '✅ 已复制' : '📋 复制'}
          </button>
        </div>

        {/* 标签 */}
        <div className={styles.tags}>
          <div className={styles.tag}>
            <span className={styles.tagIcon}>👀</span>
            <span>任何人可查看</span>
          </div>
          <div className={styles.tag}>
            <span className={styles.tagIcon}>📅</span>
            <span>7 天有效</span>
          </div>
          <div className={styles.tag}>
            <span className={styles.tagIcon}>📥</span>
            <span>无需注册下载</span>
          </div>
        </div>

        {shareResult && (
          <p className={styles.expiryText} style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-400)', marginBottom: 'var(--space-2xl)' }}>
            有效期至 {formatExpiryDate(shareResult.expiresAt)}
          </p>
        )}

        {/* 操作按钮 */}
        <div className={styles.actions}>
          <button
            className={`${styles.actionButton} ${styles.secondaryButton}`}
            onClick={() => navigate('/export')}
          >
            ← 返回导出预览
          </button>
          <button
            className={`${styles.actionButton} ${styles.primaryButton}`}
            onClick={() => navigate('/')}
          >
            🏠 回到首页
          </button>
        </div>
      </div>
    </div>
  );
}
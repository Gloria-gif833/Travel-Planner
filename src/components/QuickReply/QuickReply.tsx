import styles from './QuickReply.module.css';

interface QuickReplyProps {
  onReply: (answer: 'yes' | 'no') => void;
  mode?: 'material' | 'generate' | 'view';
}

export default function QuickReply({ onReply, mode = 'material' }: QuickReplyProps) {
  if (mode === 'view') {
    return (
      <div className={styles.quickReply}>
        <button
          className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonView}`}
          onClick={() => onReply('yes')}
        >
          查看完整攻略 ✨
        </button>
      </div>
    );
  }

  return (
    <div className={styles.quickReply}>
      {mode === 'material' ? (
        <>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={() => onReply('yes')}
          >
            是的，我有素材要上传 📎
          </button>
          <button
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={() => onReply('no')}
          >
            没有，直接生成攻略 🚀
          </button>
        </>
      ) : (
        <>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={() => onReply('yes')}
          >
            好的，帮我生成攻略 ✨
          </button>
          <button
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={() => onReply('no')}
          >
            先不用了 👋
          </button>
        </>
      )}
    </div>
  );
}
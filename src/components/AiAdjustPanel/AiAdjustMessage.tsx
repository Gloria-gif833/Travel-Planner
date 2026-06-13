import type { Message } from '../../types/conversation';
import styles from './AiAdjustPanel.module.css';

interface AiAdjustMessageProps {
  message: Message;
}

export default function AiAdjustMessage({ message }: AiAdjustMessageProps) {
  const isAi = message.role === 'ai';

  return (
    <div className={`${styles.message} ${isAi ? styles.aiMessage : styles.userMessage}`}>
      {isAi && <span className={styles.avatar}>🤖</span>}
      <div className={styles.bubble}>
        <p>{message.text}</p>
      </div>
      {!isAi && <span className={styles.avatar}>👤</span>}
    </div>
  );
}
import type { Message } from '../../types/conversation';
import styles from './ChatArea.module.css';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isAi = message.role === 'ai';

  return (
    <div className={`${styles.message} ${isAi ? styles.ai : styles.user}`}>
      {isAi && <span className={styles.avatar}>🤖</span>}
      <div className={styles.bubble}>
        <p className={styles.text}>{message.text}</p>
      </div>
      {!isAi && <span className={styles.avatar}>👤</span>}
    </div>
  );
}
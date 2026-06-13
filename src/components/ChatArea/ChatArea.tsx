import { useEffect, useRef } from 'react';
import type { Message } from '../../types/conversation';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import styles from './ChatArea.module.css';

interface ChatAreaProps {
  messages: Message[];
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatArea({
  messages,
  onSend,
  disabled = false,
  placeholder,
}: ChatAreaProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={styles.chatArea}>
      <div className={styles.messageList} ref={listRef}>
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </div>
      <ChatInput onSend={onSend} disabled={disabled} placeholder={placeholder} />
    </div>
  );
}
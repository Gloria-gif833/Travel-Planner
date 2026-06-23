import { useState, useRef, useEffect } from 'react';
import { useAiAdjust } from '../../hooks/useAiAdjust';
import AiAdjustMessage from './AiAdjustMessage';
import styles from './AiAdjustPanel.module.css';

interface AiAdjustDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function AiAdjustDrawer({ open, onClose }: AiAdjustDrawerProps) {
  const { messages, isProcessing, sendMessage } = useAiAdjust();
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isProcessing) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* 遮罩层 */}
      {open && <div className={styles.drawerOverlay} onClick={onClose} />}

      {/* 抽屉面板 */}
      <div className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}>
        {/* 标题栏 */}
        <div className={styles.drawerHeader}>
          <h3 className={styles.title}>
            💬 AI 攻略调整
            <span className={styles.badge}>
              {isProcessing ? '思考中...' : '对话调整'}
            </span>
          </h3>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* 消息列表 */}
        <div className={styles.drawerMessageList} ref={listRef}>
          {messages.length === 0 ? (
            <div className={styles.empty}>
              暂无对话，开始调整攻略吧~
            </div>
          ) : (
            messages.map((msg) => (
              <AiAdjustMessage key={msg.id} message={msg} />
            ))
          )}
        </div>

        {/* 输入区 */}
        <div className={styles.drawerInputArea}>
          <input
            type="text"
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isProcessing ? 'AI 处理中...' : '输入调整需求...'}
            disabled={isProcessing}
            autoFocus
          />
          <button
            className={styles.sendButton}
            onClick={handleSend}
            disabled={isProcessing || !input.trim()}
          >
            ➤
          </button>
        </div>
      </div>
    </>
  );
}
import { useState } from 'react';
import styles from './TextPasteArea.module.css';

interface TextPasteAreaProps {
  onAdd: (text: string) => void;
  value?: string;
  onChange?: (text: string) => void;
}

export default function TextPasteArea({ onAdd, value, onChange }: TextPasteAreaProps) {
  const handleSubmit = () => {
    if (!value || !value.trim()) return;
    onAdd(value.trim());
    if (onChange) onChange('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 非受控模式（当没有传入 value/onChange 时作为备份）
  if (value === undefined || onChange === undefined) {
    return <UncontrolledTextPasteArea onAdd={onAdd} />;
  }

  return (
    <div className={styles.pasteArea}>
      <textarea
        className={styles.textarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={"支持粘贴多段文本，每段用分隔线隔开\n例如：\n---\n我在小红书上看到这家店评价很好\n---\n朋友推荐去这个景点"}
        rows={5}
      />
      <button
        className={styles.addButton}
        onClick={handleSubmit}
        disabled={!value.trim()}
      >
        + 添加文本素材
      </button>
    </div>
  );
}

/**
 * 非受控版本（向后兼容）
 */
function UncontrolledTextPasteArea({ onAdd }: { onAdd: (text: string) => void }) {
  const [localValue, setLocalValue] = useState('');

  const handleSubmit = () => {
    if (!localValue.trim()) return;
    onAdd(localValue.trim());
    setLocalValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={styles.pasteArea}>
      <textarea
        className={styles.textarea}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={"支持粘贴多段文本，每段用分隔线隔开\n例如：\n---\n我在小红书上看到这家店评价很好\n---\n朋友推荐去这个景点"}
        rows={5}
      />
      <button
        className={styles.addButton}
        onClick={handleSubmit}
        disabled={!localValue.trim()}
      >
        + 添加文本素材
      </button>
    </div>
  );
}
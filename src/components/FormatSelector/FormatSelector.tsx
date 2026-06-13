import type { ExportFormat } from '../../hooks/useExport';
import styles from './FormatSelector.module.css';

interface FormatSelectorProps {
  format: ExportFormat;
  onChange: (format: ExportFormat) => void;
}

export default function FormatSelector({ format, onChange }: FormatSelectorProps) {
  return (
    <div className={styles.selector}>
      <button
        className={`${styles.button} ${format === 'pdf' ? styles.active : ''}`}
        onClick={() => onChange('pdf')}
      >
        📄 PDF
      </button>
      <button
        className={`${styles.button} ${format === 'word' ? styles.active : ''}`}
        onClick={() => onChange('word')}
      >
        📝 Word
      </button>
    </div>
  );
}
import { useState } from 'react';
import type { PracticalInfo } from '../../types/itinerary';
import styles from './InfoPanel.module.css';

interface InfoPanelProps {
  info: PracticalInfo;
  onUpdate?: (field: string, value: string, userNote?: boolean) => void;
}

export default function InfoPanel({ info, onUpdate }: InfoPanelProps) {
  const total =
    (info.budget.transport || 0) +
    (info.budget.hotel || 0) +
    (info.budget.food || 0) +
    (info.budget.tickets || 0) +
    (info.budget.other || 0);

  const roundTrip = info.budget.transport;
  const oneWay = Math.round(roundTrip / 2);

  // 编辑状态
  const [editingTransport, setEditingTransport] = useState(false);
  const [editingAccommodation, setEditingAccommodation] = useState(false);
  const [editingBudgetNote, setEditingBudgetNote] = useState(false);

  const userNotes = info.userNotes || {};

  /** 保存交通建议 */
  const handleSaveTransport = (value: string) => {
    onUpdate?.('transport', value);
    setEditingTransport(false);
  };

  /** 保存住宿建议 */
  const handleSaveAccommodation = (value: string) => {
    onUpdate?.('accommodation', value);
    setEditingAccommodation(false);
  };

  /** 保存预算备注 */
  const handleSaveBudgetNote = (value: string) => {
    onUpdate?.('budgetNote', value, true);
    setEditingBudgetNote(false);
  };

  return (
    <div className={styles.panel}>
      {/* 交通建议 */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>🚗 交通建议</h4>
          {onUpdate && (
            <button
              className={styles.editBtn}
              onClick={() => setEditingTransport(!editingTransport)}
            >
              {editingTransport ? '取消' : '✎'}
            </button>
          )}
        </div>
        {editingTransport ? (
          <EditableText
            initialValue={info.transport}
            placeholder="编辑交通建议..."
            onSave={handleSaveTransport}
          />
        ) : (
          <p className={styles.cardText}>{info.transport}</p>
        )}
        {userNotes.transport && (
          <div className={styles.userNote}>
            <span className={styles.userNoteLabel}>📝 我的备注：</span>
            {userNotes.transport}
          </div>
        )}
      </div>

      {/* 住宿建议 */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>🏨 住宿建议</h4>
          {onUpdate && (
            <button
              className={styles.editBtn}
              onClick={() => setEditingAccommodation(!editingAccommodation)}
            >
              {editingAccommodation ? '取消' : '✎'}
            </button>
          )}
        </div>
        {editingAccommodation ? (
          <EditableText
            initialValue={info.accommodation}
            placeholder="编辑住宿建议..."
            onSave={handleSaveAccommodation}
          />
        ) : (
          <p className={styles.cardText}>{info.accommodation}</p>
        )}
        {userNotes.accommodation && (
          <div className={styles.userNote}>
            <span className={styles.userNoteLabel}>📝 我的备注：</span>
            {userNotes.accommodation}
          </div>
        )}
      </div>

      {/* 预算明细 */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h4 className={styles.cardTitle}>💰 预算明细</h4>
          {onUpdate && (
            <button
              className={styles.editBtn}
              onClick={() => setEditingBudgetNote(!editingBudgetNote)}
            >
              {editingBudgetNote ? '取消' : '✎'}
            </button>
          )}
        </div>
        <div className={styles.budgetItems}>
          <div className={styles.budgetRow}>
            <span>🚄 大交通（往返）</span>
            <span>¥{roundTrip.toLocaleString()}</span>
          </div>
          {oneWay > 0 && (
            <div className={styles.budgetSubRow}>
              <span>（单程约 ¥{oneWay.toLocaleString()}）</span>
            </div>
          )}
          <div className={styles.budgetRow}>
            <span>🏨 住宿</span>
            <span>¥{info.budget.hotel.toLocaleString()}</span>
          </div>
          <div className={styles.budgetRow}>
            <span>🍜 餐饮</span>
            <span>¥{info.budget.food.toLocaleString()}</span>
          </div>
          <div className={styles.budgetRow}>
            <span>🎫 门票</span>
            <span>¥{info.budget.tickets.toLocaleString()}</span>
          </div>
          <div className={styles.budgetRow}>
            <span>📦 其他</span>
            <span>¥{info.budget.other.toLocaleString()}</span>
          </div>
          <div className={`${styles.budgetRow} ${styles.budgetTotal}`}>
            <span>合计</span>
            <span>¥{total.toLocaleString()}</span>
          </div>
        </div>
        <div className={styles.perPersonHint}>🙋 以上均为人均预算哦~</div>
        {editingBudgetNote && (
          <div className={styles.editNoteArea}>
            <EditableText
              initialValue={userNotes.budgetNote || ''}
              placeholder="记录你的实际花费或预算备注..."
              onSave={handleSaveBudgetNote}
            />
          </div>
        )}
        {userNotes.budgetNote && !editingBudgetNote && (
          <div className={styles.userNote}>
            <span className={styles.userNoteLabel}>📝 预算备注：</span>
            {userNotes.budgetNote}
          </div>
        )}
      </div>
    </div>
  );
}

/** 可编辑文本组件 — 点击后变为输入框，保存后退出编辑 */
function EditableText({
  initialValue,
  placeholder,
  onSave,
}: {
  initialValue: string;
  placeholder: string;
  onSave: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <div className={styles.editArea}>
      <textarea
        className={styles.editTextarea}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={3}
        autoFocus
      />
      <button
        className={styles.saveBtn}
        onClick={() => onSave(value.trim())}
      >
        保存
      </button>
    </div>
  );
}
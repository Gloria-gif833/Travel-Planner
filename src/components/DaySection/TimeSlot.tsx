import type { TimeSlot as TimeSlotType, Spot } from '../../types/itinerary';
import SpotItem from './SpotItem';
import styles from './DaySection.module.css';

interface TimeSlotProps {
  slot: TimeSlotType;
  dayIndex: number;
  slotIndex: number;
  onEditSpot?: (spot: Spot) => void;
  onDeleteSpot?: (spotId: string) => void;
  onFieldChange?: (spotId: string, field: string, value: string) => void;
  onAddSpot?: (dayIndex: number, slotIndex: number) => void;
  dragHandle?: (spotId: string) => React.ReactNode;
}

export default function TimeSlot({
  slot,
  dayIndex,
  slotIndex,
  onEditSpot,
  onDeleteSpot,
  onFieldChange,
  onAddSpot,
  dragHandle,
}: TimeSlotProps) {
  const emojiMap: Record<string, string> = {
    上午: '🌅',
    下午: '☀️',
    晚上: '🌙',
  };

  return (
    <div className={styles.slot}>
      <div className={styles.slotHeader}>
        <span className={styles.slotIcon}>{emojiMap[slot.label] ?? '📌'}</span>
        <h4 className={styles.slotLabel}>{slot.label}</h4>
      </div>
      <div className={styles.slotContent}>
        {slot.spots.length === 0 ? (
          <div className={styles.emptySlot}>
            <p className={styles.emptySlotText}>暂无景点</p>
          </div>
        ) : (
          slot.spots.map((spot, index) => (
            <SpotItem
              key={spot.id}
              spot={spot}
              showTransport={index > 0}
              onEdit={onEditSpot}
              onDelete={onDeleteSpot}
              onFieldChange={onFieldChange}
              dragHandle={dragHandle ? dragHandle(spot.id) : undefined}
            />
          ))
        )}
        {onAddSpot && (
          <button
            className={styles.addButton}
            onClick={() => onAddSpot(dayIndex, slotIndex)}
          >
            + 添加景点/活动
          </button>
        )}
      </div>
    </div>
  );
}
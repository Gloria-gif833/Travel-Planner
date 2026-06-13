import { TRANSPORT_ICONS } from '../../types/itinerary';
import styles from './DaySection.module.css';

interface TransportLineProps {
  mode: string;
  duration: string;
}

export default function TransportLine({ mode, duration }: TransportLineProps) {
  const icon = TRANSPORT_ICONS[mode] ?? '🚶';

  return (
    <div className={styles.transportLine}>
      <div className={styles.transportDot} />
      <div className={styles.transportBar} />
      <div className={styles.transportInfo}>
        <span className={styles.transportIcon}>{icon}</span>
        <span className={styles.transportText}>
          {mode} {duration}
        </span>
      </div>
    </div>
  );
}
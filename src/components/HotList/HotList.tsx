import type { HotItem } from '../../types/hotlist';
import HotListItem from './HotListItem';
import styles from './HotList.module.css';

interface HotListProps {
  items: HotItem[];
}

export default function HotList({ items }: HotListProps) {
  return (
    <div className={styles.list}>
      {items.map((item) => (
        <HotListItem key={item.id} item={item} />
      ))}
    </div>
  );
}
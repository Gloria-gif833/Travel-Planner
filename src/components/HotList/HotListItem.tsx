import type { HotItem } from '../../types/hotlist';
import styles from './HotList.module.css';

interface HotListItemProps {
  item: HotItem;
}

export default function HotListItem({ item }: HotListItemProps) {
  const isTopThree = item.rank <= 3;

  return (
    <div className={styles.item}>
      <div className={styles.itemRank}>
        <span className={`${styles.rankNumber} ${isTopThree ? styles.rankTop : ''}`}>
          TOP {item.rank}
        </span>
      </div>
      <div className={styles.itemContent}>
        <div className={styles.itemHeader}>
          <h3 className={styles.itemTitle}>{item.title}</h3>
          {item.tags?.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
        <p className={styles.itemSources}>{item.sources}</p>
        <p className={styles.itemSummary}>{item.summary}</p>
      </div>
    </div>
  );
}
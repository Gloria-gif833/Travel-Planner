import styles from './PlaceholderPage.module.css';

interface PlaceholderPageProps {
  title: string;
  emoji?: string;
}

export default function PlaceholderPage({ title, emoji = '📄' }: PlaceholderPageProps) {
  return (
    <div className={styles.container}>
      <span className={styles.emoji}>{emoji}</span>
      <h2 className={styles.title}>{title}</h2>
    </div>
  );
}
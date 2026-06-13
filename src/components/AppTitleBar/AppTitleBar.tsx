import styles from './AppTitleBar.module.css';

export default function AppTitleBar() {
  return (
    <header className={styles.titlebar}>
      <h1 className={styles.title}>
        Travel Planner - 你的私人旅行规划助手
      </h1>
    </header>
  );
}
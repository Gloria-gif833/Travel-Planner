import { useHotData } from '../hooks/useHotData';
import HotList from '../components/HotList/HotList';
import styles from '../styles/home.module.css';

export default function HomePage() {
  const { data, loading, error } = useHotData();

  // 格式化当前时间
  const now = new Date();
  const formattedTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // 加载状态
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <span className={styles.loadingText}>正在加载热榜数据...</span>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <span className={styles.errorText}>{error}</span>
          <button className={styles.retryButton} onClick={() => window.location.reload()}>
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 头部 */}
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>🔥 旅游热榜</h2>
        <span className={styles.badge}>实时聚合</span>
        <span className={styles.updateTime}>更新于 {formattedTime}</span>
      </div>

      {/* 热榜列表 */}
      <HotList items={data} />

      {/* 数据来源声明 */}
      <div className={styles.footer}>
        数据来源：微博热搜、抖音热点、小红书热搜、公众号热搜 — HotData 聚合
      </div>
    </div>
  );
}
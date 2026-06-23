import { useNavigate } from 'react-router-dom';
import styles from '../styles/requirementChoice.module.css';

export default function RequirementChoicePage() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.pageTitle}>📋 需求搜集</h2>
        <p className={styles.pageDesc}>请选择你喜欢的需求采集方式</p>
      </div>

      <div className={styles.cards}>
        {/* AI 对话引导 */}
        <button
          className={styles.card}
          onClick={() => navigate('/dialog')}
        >
          <div className={styles.cardIcon}>💬</div>
          <h3 className={styles.cardTitle}>AI 对话引导</h3>
          <p className={styles.cardDesc}>
            AI 小助手像朋友一样逐步询问你的目的地、天数、预算等信息，
            通过 3-5 轮自然对话完成需求收集。
          </p>
          <div className={styles.cardFeatures}>
            <span className={styles.feature}>✅ 适合不确定具体计划的你</span>
            <span className={styles.feature}>✅ 自然聊天，轻松填写</span>
            <span className={styles.feature}>✅ 覆盖全部 9 项需求</span>
          </div>
          <span className={styles.cardAction}>
            开始对话 →
          </span>
        </button>

        {/* 快速填写 */}
        <button
          className={`${styles.card} ${styles.cardQuick}`}
          onClick={() => navigate('/quick-requirement')}
        >
          <div className={styles.cardIcon}>⚡</div>
          <h3 className={styles.cardTitle}>快速填写</h3>
          <p className={styles.cardDesc}>
            通过表单一次性选择出发地、目的地、出行日期、天数、
            旅行偏好，所有信息一目了然，一键提交。
          </p>
          <div className={styles.cardFeatures}>
            <span className={styles.feature}>✅ 适合目标明确的你</span>
            <span className={styles.feature}>✅ 选择为主，操作快捷</span>
            <span className={styles.feature}>✅ 30 秒完成需求提交</span>
          </div>
          <span className={styles.cardAction}>
            快速填写 →
          </span>
        </button>
      </div>
    </div>
  );
}
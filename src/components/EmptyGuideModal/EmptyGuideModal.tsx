import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './EmptyGuideModal.module.css';

export default function EmptyGuideModal() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);
  const [showCountdown, setShowCountdown] = useState(false);

  useEffect(() => {
    // 先展示 1 秒，然后开始倒计时
    const timer1 = setTimeout(() => setShowCountdown(true), 1000);
    return () => clearTimeout(timer1);
  }, []);

  useEffect(() => {
    if (!showCountdown) return;
    if (countdown <= 0) {
      navigate('/dialog');
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [showCountdown, countdown, navigate]);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.icon}>🗺️</div>
        <h2 className={styles.title}>还没有攻略哦</h2>
        <p className={styles.desc}>
          目前还没有已经生成的攻略，移步到需求页和 AI 小助理一起<br />
          制定一份属于你的专属攻略吧！
        </p>

        {showCountdown ? (
          <div className={styles.countdownArea}>
            <div className={styles.countdownCircle}>
              <span className={styles.countdownNumber}>{countdown}</span>
            </div>
            <p className={styles.countdownText}>
              {countdown > 0 ? `${countdown} 秒后自动跳转...` : '正在跳转...'}
            </p>
          </div>
        ) : (
          <p className={styles.preparingText}>正在准备...</p>
        )}

        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={() => navigate('/dialog')}>
            💬 去找小助理
          </button>
          <button className={styles.secondaryBtn} onClick={() => navigate('/')}>
            🏠 返回首页
          </button>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VersionHistoryModal from '../components/VersionHistoryModal/VersionHistoryModal';
import styles from '../styles/itinerary.module.css';

export default function VersionPage() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(true);

  // 如果弹窗关闭，返回上一页
  const handleClose = () => {
    setModalOpen(false);
    navigate(-1);
  };

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          ← 返回上一页
        </button>
        <h2 className={styles.pageTitle}>🕐 版本历史</h2>
      </div>
      <VersionHistoryModal open={modalOpen} onClose={handleClose} />
    </div>
  );
}
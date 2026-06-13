import { useNavigate } from 'react-router-dom';
import { useExport } from '../hooks/useExport';
import FormatSelector from '../components/FormatSelector/FormatSelector';
import ExportPreview from '../components/ExportPreview/ExportPreview';
import styles from '../styles/export.module.css';

export default function ExportPage() {
  const navigate = useNavigate();
  const { format, setFormat, exporting, exportError, handleExport, itinerary } =
    useExport();

  if (!itinerary) {
    return (
      <div className={styles.container}>
        <p>暂无攻略数据，请先生成攻略</p>
      </div>
    );
  }

  const total =
    itinerary.practicalInfo.budget.transport +
    itinerary.practicalInfo.budget.hotel +
    itinerary.practicalInfo.budget.food +
    itinerary.practicalInfo.budget.tickets +
    itinerary.practicalInfo.budget.other;

  return (
    <div className={styles.container}>
      {/* 顶部操作栏 */}
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => navigate('/itinerary')}>
          ← 返回上一页
        </button>

        <FormatSelector format={format} onChange={setFormat} />

        <div className={styles.divider} />

        <div className={styles.exportActions}>
          <button className={`${styles.actionButton} ${styles.shareButton}`} onClick={() => navigate('/share?from=export')}>
            🔗 生成分享链接
          </button>
          <button
            className={`${styles.actionButton} ${styles.primaryButton}`}
            onClick={() => navigate('/itinerary')}
          >
            ✏️ 返回修改
          </button>
        </div>
      </div>

      {/* 主体布局 */}
      <div className={styles.body}>
        {/* 左侧：文档预览 */}
        <div className={styles.mainContent}>
          <ExportPreview itinerary={itinerary} format={format} />
        </div>

        {/* 右侧：信息卡片 */}
        <div className={styles.sidePanel}>
          {/* 文档信息 */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>📄 文档信息</h3>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>格式</span>
              <span className={styles.infoValue}>{format.toUpperCase()}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>攻略名称</span>
              <span className={styles.infoValue}>{itinerary.title}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>行程天数</span>
              <span className={styles.infoValue}>{itinerary.days.length} 天</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>预算总计</span>
              <span className={styles.infoValue}>¥{total.toLocaleString()}</span>
            </div>
          </div>

          {/* 分享卡片 */}
          <div className={styles.shareCard}>
            <h3 className={styles.cardTitle}>🔗 分享攻略</h3>
            <p className={styles.shareHint}>
              生成一个分享链接，任何人可查看你的旅行攻略，7 天有效。
            </p>
            <button className={styles.exportButton} onClick={() => navigate('/share?from=export')}>
              🔗 生成分享链接
            </button>
          </div>

          {/* 确认导出 */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>📥 确认导出</h3>
            {exportError && <p className={styles.errorText}>{exportError}</p>}
            <button
              className={styles.exportButton}
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting
                ? '⏳ 导出中...'
                : format === 'pdf'
                ? '📄 导出 PDF'
                : '📝 导出 Word'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
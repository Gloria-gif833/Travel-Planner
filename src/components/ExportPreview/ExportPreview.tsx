import type { ItineraryData } from '../../types/itinerary';
import { TRANSPORT_ICONS } from '../../types/itinerary';
import styles from './ExportPreview.module.css';

interface ExportPreviewProps {
  itinerary: ItineraryData;
  format: 'pdf' | 'word';
}

export default function ExportPreview({ itinerary, format: _format }: ExportPreviewProps) {
  const total =
    itinerary.practicalInfo.budget.transport +
    itinerary.practicalInfo.budget.hotel +
    itinerary.practicalInfo.budget.food +
    itinerary.practicalInfo.budget.tickets +
    itinerary.practicalInfo.budget.other;

  return (
    <div id="export-preview-content" className={styles.preview}>
      {/* 标题 */}
      <div className={styles.titleSection}>
        <h1 className={styles.mainTitle}>🗺 {itinerary.title}</h1>
        <p className={styles.subtitle}>
          📅 {itinerary.days.length}天 | 💰 约 ¥{total.toLocaleString()}
        </p>
      </div>

      {/* 每日行程 */}
      {itinerary.days.map((day) => (
        <div key={day.dayNumber} className={styles.daySection}>
          <h2 className={styles.dayTitle}>
            Day {day.dayNumber} — {day.title}
          </h2>

          {day.slots.map((slot) => (
            <div key={slot.id} className={styles.slotSection}>
              <h3 className={styles.slotTitle}>{slot.label}</h3>

              {slot.spots.map((spot, idx) => (
                <div key={spot.id} className={styles.spotCard}>
                  {idx > 0 && spot.transport && (
                    <div className={styles.transport}>
                      {TRANSPORT_ICONS[spot.transport.mode] ?? '🚶'} {spot.transport.mode} {spot.transport.duration}
                    </div>
                  )}
                  <div className={styles.spotRow}>
                    <span className={styles.spotName}>{spot.name}</span>
                    <span className={styles.spotDuration}>⏱ {spot.duration}</span>
                  </div>
                  <p className={styles.spotDesc}>{spot.description}</p>
                  {spot.tags && spot.tags.length > 0 && (
                    <div className={styles.tags}>
                      {spot.tags.map((tag) => (
                        <span key={tag} className={styles.tag}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

          {day.tips && day.tips.length > 0 && (
            <div className={styles.tipsBox}>
              <span>💡</span>
              <div>
                {day.tips.map((tip, i) => (
                  <p key={i} className={styles.tipText}>{tip}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* 实用信息 */}
      <div className={styles.infoSection}>
        <h2 className={styles.sectionTitle}>实用信息</h2>

        <div className={styles.infoCard}>
          <h4>🚗 交通建议</h4>
          <p>{itinerary.practicalInfo.transport}</p>
        </div>
        <div className={styles.infoCard}>
          <h4>🏨 住宿建议</h4>
          <p>{itinerary.practicalInfo.accommodation}</p>
        </div>
        <div className={styles.infoCard}>
          <h4>💰 预算明细</h4>
          <div className={styles.budgetGrid}>
            <span>🚄 大交通</span><span>¥{itinerary.practicalInfo.budget.transport.toLocaleString()}</span>
            <span>🏨 住宿</span><span>¥{itinerary.practicalInfo.budget.hotel.toLocaleString()}</span>
            <span>🍜 餐饮</span><span>¥{itinerary.practicalInfo.budget.food.toLocaleString()}</span>
            <span>🎫 门票</span><span>¥{itinerary.practicalInfo.budget.tickets.toLocaleString()}</span>
            <span>📦 其他</span><span>¥{itinerary.practicalInfo.budget.other.toLocaleString()}</span>
            <span className={styles.total}>合计</span>
            <span className={styles.total}>¥{total.toLocaleString()}</span>
          </div>
        </div>

        <div className={styles.noticeBox}>
          <h4>⚠️ 注意事项</h4>
          <ul>
            {itinerary.notices.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
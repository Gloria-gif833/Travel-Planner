import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../services/apiClient';
import ItineraryHeader from '../components/ItineraryHeader/ItineraryHeader';
import DaySection from '../components/DaySection/DaySection';
import InfoPanel from '../components/InfoPanel/InfoPanel';
import NoticeBox from '../components/NoticeBox/NoticeBox';
import type { ItineraryData } from '../types/itinerary';
import styles from '../styles/itinerary.module.css';

interface SharedData {
  itinerary: ItineraryData;
  expiresAt: string;
}

export default function SharedViewPage() {
  const { code } = useParams<{ code: string }>();
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) { setError('无效的分享链接'); setLoading(false); return; }

    fetch(`${apiClient.defaults.baseURL}/share/${code}`)
      .then(res => res.json())
      .then((result) => {
        if (!result.success) {
          setError(result.error?.message || '获取攻略失败');
        } else {
          // 后端返回: result.data = { expired, expiresAt, itinerary: { id, title, data: {title, days, ...} } }
          // result.data.itinerary.data 才是真正的攻略内容
          const rawItin = result.data.itinerary;
          const normalized = rawItin.data || rawItin;
          setData({
            expiresAt: result.data.expiresAt,
            itinerary: { ...normalized, id: rawItin.id },
          });
        }
      })
      .catch(() => { setError('网络错误，请稍后重试'); })
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>加载分享的攻略中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <span style={{ fontSize: '48px' }}>😅</span>
        <h2>{error === '分享链接已过期' ? '链接已过期' : '无法查看攻略'}</h2>
        <p style={{ color: '#888' }}>
          {error === '分享链接已过期' ? '该分享链接已超过 7 天有效期' : error}
        </p>
        <Link to="/" style={{ padding: '8px 24px', background: '#9E9583', color: '#fff', borderRadius: '24px', textDecoration: 'none' }}>
          回到首页
        </Link>
      </div>
    );
  }

  if (!data?.itinerary) return null;
  const itinerary = data.itinerary;

  return (
    <div style={{ padding: '0 24px' }}>
      {/* 顶部提示条 */}
      <div style={{ background: '#FFF3CD', padding: '8px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#856404', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>📅 该攻略为分享查看，有效期至 {data.expiresAt?.slice(0, 10)}</span>
        <Link to="/" style={{ color: '#856404', textDecoration: 'underline', fontSize: '13px' }}>
          前往 Travel Planner 自己定制 →
        </Link>
      </div>

      <div className={styles.body}>
        <div className={styles.mainContent}>
          <ItineraryHeader itinerary={itinerary} />
          <div className={styles.dayList}>
            {itinerary.days?.map((day, idx) => (
              <DaySection
                key={day.dayNumber}
                day={day}
                dayIndex={idx}
                defaultExpanded={day.dayNumber === 1}
              />
            ))}
          </div>
        </div>
        <div className={styles.sidePanel}>
          <InfoPanel info={itinerary.practicalInfo} onUpdate={() => {}} />
          <NoticeBox notices={itinerary.notices} />
        </div>
      </div>
    </div>
  );
}
import { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import AppTitleBar from './components/AppTitleBar/AppTitleBar';
import { useItinerary } from './context/ItineraryContext';
import { fetchItineraries, fetchItineraryById } from './services/itineraryService';
import styles from './styles/layout.module.css';

export default function AppLayout() {
  const { dispatch } = useItinerary();
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    dispatch({ type: 'SET_LOADING', payload: true });
    fetchItineraries()
      .then(async ({ items }) => {
        if (items.length > 0) {
          // 列表数据用于侧边栏显示
          dispatch({ type: 'SET_LIST', payload: items as any[] });
          // 最近一条：获取完整 data 后设为当前攻略
          const latestFull = await fetchItineraryById(items[0].id);
          if (latestFull?.data) {
            // 后端返回：{ id, guest_id, title, data: {title, days, ...}, summary }
            // latestFull.data = <itinerary object> = { title, days: [...] }
            // 需要将 id 合并到顶层，供侧边栏和切换使用
            const normalized = { ...latestFull.data, id: latestFull.id };
            if (normalized.days) {
              dispatch({ type: 'SET_ITINERARY', payload: normalized });
              dispatch({ type: 'ADD_TO_LIST', payload: normalized });
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        dispatch({ type: 'SET_LOADING', payload: false });
      });
  }, [dispatch]);

  return (
    <div className={styles.layout}>
      <div className={styles.sidebarWrap}>
        <Sidebar />
      </div>
      <div className={styles.mainArea}>
        <AppTitleBar />
        <main className={styles.pageContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
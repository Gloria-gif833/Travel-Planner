import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import MyItinerariesPanel from '../MyItinerariesPanel/MyItinerariesPanel';
import styles from './Sidebar.module.css';

interface NavItem {
  path: string;
  icon: string;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: '🔥', label: '热榜' },
  { path: '/dialog', icon: '💬', label: '对话' },
  { path: '/quick-requirement', icon: '⚡', label: '快速' },
  { path: '/upload', icon: '📎', label: '素材' },
  { path: '/itinerary', icon: '🗺', label: '攻略' },
  { path: '/version', icon: '🕐', label: '版本' },
  { path: '/export', icon: '📥', label: '导出' },
];

export default function Sidebar() {
  const location = useLocation();
  const [showPanel, setShowPanel] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isItineraryRelated =
    location.pathname === '/itinerary' || location.pathname === '/export';

  // 点击外部关闭面板
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <nav className={styles.sidebar}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
            onClick={() => {
              if (item.path === '/itinerary') {
                setShowPanel((prev) => !prev);
              }
            }}
            onMouseEnter={() => {
              if (item.path === '/itinerary') setShowPanel(true);
            }}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* 攻略列表面板（flyout） — 仅在攻略/导出页时默认展开 */}
      {(showPanel || isItineraryRelated) && (
        <div
          className={styles.flyout}
          onMouseLeave={() => {
            if (!isItineraryRelated) setShowPanel(false);
          }}
        >
          <MyItinerariesPanel onNavigate={() => setShowPanel(false)} />
        </div>
      )}
    </div>
  );
}
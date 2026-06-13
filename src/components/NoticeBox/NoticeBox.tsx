import styles from './NoticeBox.module.css';

interface NoticeBoxProps {
  notices: string[];
}

export default function NoticeBox({ notices }: NoticeBoxProps) {
  return (
    <div className={styles.noticeBox}>
      <h4 className={styles.title}>⚠️ 注意事项</h4>
      <ul className={styles.list}>
        {notices.map((notice, index) => (
          <li key={index} className={styles.item}>
            {notice}
          </li>
        ))}
      </ul>
    </div>
  );
}
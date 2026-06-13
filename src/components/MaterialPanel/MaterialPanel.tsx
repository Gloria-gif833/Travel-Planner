import type { Material } from '../../types/material';
import styles from './MaterialPanel.module.css';

interface MaterialPanelProps {
  materials: Material[];
}

export default function MaterialPanel({ materials }: MaterialPanelProps) {
  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>📎 素材</h3>

      {materials.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📭</span>
          <p className={styles.emptyText}>暂无素材</p>
          <p className={styles.emptyHint}>
            可在对话中上传相关攻略或图片
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {materials.map((material) => (
            <div key={material.id} className={styles.item}>
              {material.type === 'image' ? (
                <div className={styles.imageThumb}>
                  <img src={material.content} alt={material.fileName ?? '素材图片'} />
                </div>
              ) : (
                <div className={styles.textIcon}>📝</div>
              )}
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>
                  {material.type === 'image'
                    ? (material.fileName ?? '图片素材')
                    : '文本素材'}
                </span>
                {material.type === 'text' && (
                  <span className={styles.itemSnippet}>
                    {material.content.slice(0, 50)}{material.content.length > 50 ? '...' : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import type { Material } from '../../types/material';
import styles from './MaterialPreview.module.css';

interface MaterialPreviewProps {
  materials: Material[];
  onRemove: (id: string) => void;
}

export default function MaterialPreview({ materials, onRemove }: MaterialPreviewProps) {
  if (materials.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>📭</span>
        <p className={styles.emptyText}>还没有添加素材</p>
        <p className={styles.emptyHint}>上传图片或粘贴文本开始</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {materials.map((material) => (
        <div key={material.id} className={styles.item}>
          {material.type === 'image' ? (
            <div className={styles.imageWrap}>
              <img src={material.content} alt={material.fileName ?? '素材图片'} />
            </div>
          ) : (
            <div className={styles.textWrap}>
              <p className={styles.textContent}>{material.content}</p>
            </div>
          )}
          <div className={styles.itemInfo}>
            <span className={styles.itemName}>
              {material.fileName ?? '文本素材'}
            </span>
            <span className={styles.itemType}>
              {material.type === 'image' ? '图片' : '文本'}
            </span>
          </div>
          <button
            className={styles.removeButton}
            onClick={() => onRemove(material.id)}
            title="删除"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
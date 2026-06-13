import { useState, useRef, type DragEvent } from 'react';
import styles from './UploadArea.module.css';

interface UploadAreaProps {
  onUpload: (files: FileList | File[]) => Promise<void>;
  uploading?: boolean;
}

export default function UploadArea({ onUpload, uploading = false }: UploadAreaProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      // 重置 input 以允许重复选择同一文件
      e.target.value = '';
    }
  };

  return (
    <div
      className={`${styles.uploadArea} ${dragging ? styles.dragging : ''} ${uploading ? styles.uploading : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={handleFileChange}
      />

      {uploading ? (
        <div className={styles.content}>
          <div className={styles.spinner} />
          <p className={styles.text}>正在上传...</p>
        </div>
      ) : dragging ? (
        <div className={styles.content}>
          <span className={styles.icon}>📂</span>
          <p className={styles.text}>松开鼠标上传文件</p>
        </div>
      ) : (
        <div className={styles.content}>
          <span className={styles.icon}>📁</span>
          <p className={styles.text}>
            点击上传或拖拽图片到这里
          </p>
          <p className={styles.hint}>
            支持 JPG / PNG / WEBP，单文件最大 10MB
          </p>
        </div>
      )}
    </div>
  );
}
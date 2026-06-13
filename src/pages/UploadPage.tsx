import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversation } from '../context/ConversationContext';
import { useUpload } from '../hooks/useUpload';
import UploadArea from '../components/UploadArea/UploadArea';
import TextPasteArea from '../components/TextPasteArea/TextPasteArea';
import MaterialPreview from '../components/MaterialPreview/MaterialPreview';
import type { Material } from '../types/material';
import styles from '../styles/upload.module.css';

export default function UploadPage() {
  const navigate = useNavigate();
  const { dispatch } = useConversation();
  const {
    materials,
    uploading,
    addTextMaterial,
    addImages,
    removeMaterial,
    clearMaterials,
  } = useUpload();

  const [submitted, setSubmitted] = useState(false);
  const [pendingText, setPendingText] = useState('');

  /**
   * 将当前素材同步到全局 Context
   */
  const syncMaterialsToContext = useCallback(
    (mats: Material[]) => {
      dispatch({ type: 'CLEAR_MATERIALS' });
      mats.forEach((m) => {
        dispatch({ type: 'ADD_MATERIAL', payload: m });
      });
    },
    [dispatch]
  );

  /**
   * 跳过素材
   */
  const handleSkip = () => {
    clearMaterials();
    navigate('/dialog');
  };

  /**
   * 继续添加
   */
  const handleContinue = () => {
    // 如果文本区有内容，先添加为素材
    if (pendingText.trim()) {
      addTextMaterial(pendingText.trim());
      setPendingText('');
    }
  };

  /**
   * 确认提交 — 自动捕获文本区未添加的内容
   */
  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);

    // 如果文本区还有未添加的内容，自动添加
    let finalMaterials = [...materials];
    if (pendingText.trim()) {
      const textMaterial: Material = {
        id: `mat_${Date.now()}_auto`,
        type: 'text',
        content: pendingText.trim(),
        createdAt: Date.now(),
      };
      finalMaterials.push(textMaterial);
      // 同步更新本地状态
      addTextMaterial(pendingText.trim());
      setPendingText('');
    }

    // 同步到全局 Context（用完整的 finalMaterials）
    dispatch({ type: 'CLEAR_MATERIALS' });
    finalMaterials.forEach((m) => {
      dispatch({ type: 'ADD_MATERIAL', payload: m });
    });

    navigate('/dialog?fromUpload=true');
  };

  const hasContent = materials.length > 0 || pendingText.trim().length > 0;

  return (
    <div className={styles.container}>
      {/* 顶部栏 */}
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => navigate('/dialog')}>
          ← 返回上一页
        </button>
        <h2 className={styles.pageTitle}>📎 素材粘贴板</h2>
      </div>

      {/* 图片上传区 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>📷 上传图片</h3>
        <UploadArea onUpload={addImages} uploading={uploading} />
      </div>

      {/* 文本粘贴区 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>📝 粘贴文本</h3>
        <TextPasteArea
          onAdd={addTextMaterial}
          value={pendingText}
          onChange={setPendingText}
        />
      </div>

      {/* 素材预览 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          已添加素材 ({materials.length})
        </h3>
        <MaterialPreview materials={materials} onRemove={removeMaterial} />
      </div>

      {/* 操作按钮 */}
      <div className={styles.actions}>
        <button
          className={`${styles.actionButton} ${styles.skipButton}`}
          onClick={handleSkip}
        >
          ⏭ 跳过素材
        </button>
        <button
          className={`${styles.actionButton} ${styles.addMoreButton}`}
          onClick={handleContinue}
          disabled={!pendingText.trim()}
        >
          + 继续添加
        </button>
        <button
          className={`${styles.actionButton} ${styles.submitButton}`}
          onClick={handleSubmit}
          disabled={!hasContent || submitted}
        >
          ✓ 确认提交
        </button>
      </div>
    </div>
  );
}
import { useState, useCallback } from 'react';
import type { Material } from '../types/material';

/* ========================================
   useUpload Hook — 素材上传/管理逻辑
   ======================================== */

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

let idCounter = 0;
function generateId() {
  idCounter += 1;
  return `mat_${Date.now()}_${idCounter}`;
}

export function useUpload() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [uploading, setUploading] = useState(false);

  /**
   * 添加文本素材
   */
  const addTextMaterial = useCallback((text: string) => {
    if (!text.trim()) return;

    const material: Material = {
      id: generateId(),
      type: 'text',
      content: text.trim(),
      createdAt: Date.now(),
    };
    setMaterials((prev) => [...prev, material]);
  }, []);

  /**
   * 添加图片素材（支持 File 对象或 data URL）
   */
  const addImageMaterial = useCallback(async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('仅支持 JPG / PNG / WEBP 格式');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('文件大小不能超过 10MB');
    }

    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const material: Material = {
          id: generateId(),
          type: 'image',
          content: reader.result as string,
          fileName: file.name,
          createdAt: Date.now(),
        };
        setMaterials((prev) => [...prev, material]);
        resolve();
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  }, []);

  /**
   * 批量添加图片
   */
  const addImages = useCallback(
    async (files: FileList | File[]) => {
      setUploading(true);
      try {
        for (const file of Array.from(files)) {
          await addImageMaterial(file);
        }
      } finally {
        setUploading(false);
      }
    },
    [addImageMaterial]
  );

  /**
   * 删除素材
   */
  const removeMaterial = useCallback((id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  }, []);

  /**
   * 清空素材
   */
  const clearMaterials = useCallback(() => {
    setMaterials([]);
  }, []);

  /**
   * 获取提交数据
   */
  const getSubmitData = useCallback(() => {
    return {
      images: materials.filter((m) => m.type === 'image'),
      texts: materials.filter((m) => m.type === 'text'),
    };
  }, [materials]);

  return {
    materials,
    uploading,
    addTextMaterial,
    addImages,
    removeMaterial,
    clearMaterials,
    getSubmitData,
  };
}
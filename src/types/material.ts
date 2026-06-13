/* ========================================
   素材数据类型（步骤 03/04 共用）
   ======================================== */

export type MaterialType = 'image' | 'text';

export interface Material {
  id: string;
  type: MaterialType;
  content: string;       // 文本内容 or 图片 base64/data URL
  fileName?: string;     // 图片文件名
  description?: string;  // 用户描述
  createdAt: number;
}
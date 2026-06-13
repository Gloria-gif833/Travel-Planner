/* ========================================
   版本快照数据类型
   ======================================== */

export type ChangeType = 'initial' | 'manual' | 'ai_adjust';

export interface VersionSnapshot {
  id: string;
  versionNumber: number;
  itineraryId: string;
  data: string;           // JSON.stringify 的完整攻略数据
  changeType: ChangeType;
  changeSummary: string;
  createdAt: string;       // ISO string
}

export interface VersionGroup {
  versions: VersionSnapshot[];
  currentVersion: number;
}
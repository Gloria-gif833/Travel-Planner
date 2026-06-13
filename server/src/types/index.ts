/* ========================================
   共享类型定义
   ======================================== */

// 统一响应格式
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// 健康检查响应
export interface HealthCheckResponse {
  status: 'ok';
  timestamp: string;
  uptime: number;
}
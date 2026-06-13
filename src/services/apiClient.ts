import axios from 'axios';
import { API_CONFIG } from '../config/api';
import { getGuestId } from '../utils/guestId';

/* ========================================
   Axios 实例 — 统一请求配置
   增强版：错误分类 + 超时检测 + 401 处理
   ======================================== */

const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：附加 Token + 访客 ID
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // 免登录访客标识：首次访问自动生成 UUID
    config.headers['X-Guest-Id'] = getGuestId();
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：统一错误处理
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const serverMessage = data?.error?.message || '';
      let message = '请求失败';

      switch (status) {
        case 400:
          message = serverMessage || '请求参数错误';
          break;
        case 401:
          message = serverMessage || '登录已过期，请重新登录';
          localStorage.removeItem('auth_token');
          // 不在登录页时跳转
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          break;
        case 403:
          message = serverMessage || '没有权限执行此操作';
          break;
        case 404:
          message = serverMessage || '请求的资源不存在';
          break;
        case 409:
          message = serverMessage || '资源冲突';
          break;
        case 429:
          message = '请求过于频繁，请稍后再试';
          break;
        case 500:
          message = serverMessage || '服务器内部错误，请稍后重试';
          break;
        default:
          message = serverMessage || `请求失败 (${status})`;
      }

      return Promise.reject(new Error(message));
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('请求超时，请检查网络连接'));
    }

    if (error.code === 'ERR_NETWORK' || !error.response) {
      return Promise.reject(new Error('网络连接失败，请检查服务器是否运行'));
    }

    return Promise.reject(error);
  }
);

export default apiClient;
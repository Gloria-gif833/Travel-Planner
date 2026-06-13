import apiClient from './apiClient';

/* ========================================
   前端认证 API 调用
   ======================================== */

export interface AuthResult {
  id: string;
  email: string;
  name: string;
  token: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
}

/**
 * 注册
 */
export async function register(
  email: string,
  password: string,
  name?: string
): Promise<AuthResult> {
  const data: any = await apiClient.post('/auth/register', { email, password, name });
  return data.data as AuthResult;
}

/**
 * 登录
 */
export async function login(
  email: string,
  password: string
): Promise<AuthResult> {
  const data: any = await apiClient.post('/auth/login', { email, password });
  return data.data as AuthResult;
}

/**
 * 获取当前用户
 */
export async function getMe(): Promise<UserInfo> {
  const data: any = await apiClient.get('/auth/me');
  return data.data as UserInfo;
}
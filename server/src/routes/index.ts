import { Router } from 'express';
import { sendSuccess } from '../utils/response';
import type { HealthCheckResponse } from '../types';
import chatRouter from './chat';
import generateRouter from './generate';
import adjustRouter from './adjust';
import authRouter from './auth';
import itinerariesRouter from './itineraries';
import materialsRouter from './materials';
import shareRouter from './share';

const router = Router();

// 健康检查
router.get('/health', (_req, res) => {
  const data: HealthCheckResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
  sendSuccess(res, data);
});

// 认证路由
router.use('/auth', authRouter);

// AI 路由
router.use('/chat', chatRouter);
router.use('/generate', generateRouter);
router.use('/adjust', adjustRouter);

// 攻略 CRUD
router.use('/itineraries', itinerariesRouter);

// 素材管理
router.use('/materials', materialsRouter);

// 分享链接
router.use('/share', shareRouter);

export default router;
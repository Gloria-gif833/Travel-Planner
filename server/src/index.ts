import app from './app';
import { config } from './config';
import { logger } from './utils/logger';

app.listen(config.port, () => {
  logger.info(`🚀 Travel Planner API 服务已启动`);
  logger.info(`📡 端口: ${config.port}`);
  logger.info(`🌐 环境: ${config.nodeEnv}`);
  logger.info(`🔄 CORS 允许源: ${config.corsOrigin}`);
  logger.info(`🏥 健康检查: http://localhost:${config.port}/api/health`);
});
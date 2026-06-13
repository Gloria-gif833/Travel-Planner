import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middlewares/errorHandler';
import routes from './routes';
import { logger } from './utils/logger';

const app = express();

// ---- 基础中间件 ----
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- 静态文件（上传目录） ----
app.use('/uploads', express.static('uploads'));

// ---- 请求日志 ----
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.url}`);
  next();
});

// ---- 路由 ----
app.use('/api', routes);

// ---- 错误处理 ----
app.use(errorHandler);

export default app;
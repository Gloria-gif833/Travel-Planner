FROM node:20-alpine

WORKDIR /app

# 复制依赖配置
COPY package.json package-lock.json ./
RUN npm ci --only=production

# 复制源码并构建
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# 创建上传目录
RUN mkdir -p uploads

# 如果使用 SQLite，确保数据库目录存在
RUN mkdir -p prisma

EXPOSE 3001

CMD ["node", "dist/index.js"]
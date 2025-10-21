# ===========================================
# 构建阶段 - 安装依赖并编译项目
# ===========================================
FROM node:24-alpine AS builder

# 设置镜像源加速
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories

# 设置 npm 镜像源
RUN npm config set registry https://registry.npmmirror.com

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm ci --frozen-lockfile

# 复制源代码
COPY . .

# 构建 TypeScript 项目
RUN npm run build

# ===========================================
# 生产阶段 - 最小化运行时镜像
# ===========================================
FROM node:24-alpine AS production

# 设置镜像源加速
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories

# 设置 npm 镜像源
RUN npm config set registry https://registry.npmmirror.com

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 只安装生产依赖并清理缓存
RUN npm ci --only=production --frozen-lockfile && \
    npm cache clean --force

# 从构建阶段复制编译产物
COPY --from=builder /app/dist ./dist

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S harbor -u 1001 -G nodejs

# 设置文件权限
RUN chown -R harbor:nodejs /app

# 切换到非 root 用户
USER harbor

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 启动应用
CMD ["npm", "start"]
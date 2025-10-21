# ===========================================
# 构建阶段 - 安装依赖并编译项目
# ===========================================
FROM oven/bun:1-alpine AS builder

# 设置镜像源加速
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package.json bun.lock ./

# 安装依赖
RUN bun install --frozen-lockfile

# 复制源代码
COPY . .

# 构建项目
RUN bun run build

# ===========================================
# 生产阶段 - 最小化运行时镜像
# ===========================================
FROM oven/bun:1-alpine AS production

# 设置镜像源加速
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package.json bun.lock ./

# 只安装生产依赖
RUN bun install --production --frozen-lockfile

# 从构建阶段复制编译产物
COPY --from=builder /app/dist ./dist

# 创建非 root 用户
RUN addgroup -g 1001 -S appgroup && \
    adduser -S harbor -u 1001 -G appgroup

# 设置文件权限
RUN chown -R harbor:appgroup /app

# 确保数据库文件目录存在且有正确权限
RUN mkdir -p /app && chown -R harbor:appgroup /app

# 切换到非 root 用户
USER harbor

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 启动应用
CMD ["bun", "run", "start"]

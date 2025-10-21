FROM oven/bun:1-alpine

# 设置工作目录
WORKDIR /app

# 复制所有文件
COPY . .

# 安装依赖
RUN bun install

# 构建项目
RUN bun run build

# 确保数据库文件目录存在且有正确权限
RUN mkdir -p /app && chmod 777 /app

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 启动应用
CMD ["bun", "run", "start"]

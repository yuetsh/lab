# 构建阶段：编译 Vue 前端
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# 先复制依赖清单，让依赖层可以命中缓存
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

# 复制源码并构建到 dist/
COPY . .
RUN bun run build

# 运行阶段：Caddy 直接托管构建产物
FROM caddy:alpine

COPY --from=builder /app/dist /usr/share/caddy

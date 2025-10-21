
FROM node:24-alpine AS builder

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories

RUN apk add --no-cache python3 make g++

RUN npm config set registry https://registry.npmmirror.com

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# 生产阶段
FROM node:24-alpine AS production

RUN npm config set registry https://registry.npmmirror.com

WORKDIR /app

# 只复制生产依赖
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 只复制构建产物
COPY --from=builder /app/dist ./dist

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]

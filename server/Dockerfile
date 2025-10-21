FROM node:24-alpine

# 安装 Python 和构建工具来支持 better-sqlite3 编译
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]

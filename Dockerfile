# ⚙️ 基础构建镜像：含 pnpm + 源码
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./

# 📦 安装 prod 依赖
FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile

# 🛠️ 构建阶段
FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# 🚀 最终运行镜像
FROM node:22-alpine
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
VOLUME ["/app/storage", "/app/config"]
EXPOSE 8088
CMD [ "node", "./dist/index.js" ]

FROM node:alpine
MAINTAINER ronggang
# 默认端口
EXPOSE 8088
# 工作路径
ARG APP_PATH="/app"
# 设置工作路径
WORKDIR $APP_PATH
# 设置虚拟卷，以方便外部指定
VOLUME ["$APP_PATH/storage", "$APP_PATH/config"]

# 复制安装包所需要的文件
COPY ./package.json ./tsconfig.json ./yarn.lock $APP_PATH/
# 安装环境
RUN yarn install
# 复制源码
COPY ./src $APP_PATH/
# 编译源码
RUN yarn build
# 启动程序
CMD yarn start
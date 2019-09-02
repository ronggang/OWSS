FROM node:alpine
MAINTAINER ronggang
EXPOSE 8088
COPY ./src ./package.json ./tsconfig.json ./yarn.lock /app/
WORKDIR /app
RUN yarn install && yarn build
CMD yarn start
VOLUME /app/storage
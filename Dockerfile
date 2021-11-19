FROM node:14-alpine

# from https://github.com/spritsail/alpine-cmake/blob/master/Dockerfile
# needed to build @hanazuki/node-jsonnet
RUN apk --no-cache add cmake clang clang-dev make gcc g++ libc-dev linux-headers

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn

COPY plugin.js ./
COPY lib lib/

CMD /usr/local/bin/node /app/plugin.js

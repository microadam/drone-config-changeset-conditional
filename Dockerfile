FROM node:10.15.1-alpine

WORKDIR /app
COPY . .

RUN yarn

CMD /usr/local/bin/node /app/plugin.js
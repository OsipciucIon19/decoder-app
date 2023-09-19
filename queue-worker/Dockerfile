FROM node:16-alpine

ENV NODE_ENV=development

WORKDIR /node/app

COPY package*.json ./

RUN npm install && npm install -g nodemon && npm cache clean --force

WORKDIR /node/app/src

CMD ["nodemon", "server.js"]
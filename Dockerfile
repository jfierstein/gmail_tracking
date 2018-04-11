FROM node:9.8
MAINTAINER "josh.fierstein@gmail.com"

COPY package.json .

RUN yarn install

COPY . .

CMD npm start
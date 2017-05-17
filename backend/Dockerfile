FROM mhart/alpine-node:latest
MAINTAINER Alexis Tyler <xo@wvvw.me>

RUN npm install --global yarn

RUN apk --no-cache add tini git openssh-client \
    && apk --no-cache add --virtual devs tar curl

RUN mkdir /app

WORKDIR /app

RUN yarn install --production
COPY . .

ENV MONGO_URL 'localhost:27017'
ENV MONGO_USER ''
ENV MONGO_PASS ''

EXPOSE 5000

ENTRYPOINT ["/sbin/tini"]

CMD ["yarn", "start:production"]

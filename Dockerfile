FROM node:alpine

COPY . /server
WORKDIR /server

RUN apk add --update --no-cache git curl \
    && npm install \
    && apk del --no-cache git

EXPOSE 80
HEALTHCHECK --interval=5s CMD curl -f http://127.0.0.1/ok | grep "ok" | grep "ok" || exit 1
ENTRYPOINT ["npm", "start"]


FROM node:slim

COPY . /server
WORKDIR /server

RUN apt-get update -yq \
    && apt-get upgrade -yq \
    && apt-get install git -yq \
    && npm install \
    && apt-get purge git -yq \
    && apt-get autoremove -yq

EXPOSE 80
ENTRYPOINT ["npm", "start"]


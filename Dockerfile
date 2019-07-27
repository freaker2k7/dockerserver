FROM node:12

RUN curl -L https://get.docker.com | sh -
RUN npm i -g docker-server@1.7.2

CMD ["docker-server"]
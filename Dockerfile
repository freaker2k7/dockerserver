FROM node:12

RUN curl -L https://get.docker.com | sh -
RUN npm i -g docker-server@1.9.0

CMD ["docker-server"]
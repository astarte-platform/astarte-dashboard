FROM node:20.3.1 as builder

WORKDIR /app
ADD . .
RUN apt-get -qq update
RUN apt-get -qq install netbase build-essential autoconf libffi-dev
RUN npm ci --production
RUN npm run build

FROM nginx:1
COPY --from=builder /app/build/ /usr/share/nginx/html/
ADD default.conf /etc/nginx/conf.d/

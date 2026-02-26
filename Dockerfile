FROM node:20.3.1 as builder

ARG vite_show_dashboard_sidebar=true
ENV VITE_SHOW_DASHBOARD_SIDEBAR=${vite_show_dashboard_sidebar}

WORKDIR /app
ADD . .
RUN apt-get -qq update
RUN apt-get -qq install netbase build-essential autoconf libffi-dev
RUN npm ci --production
RUN npm run build

FROM nginx:1
COPY --from=builder /app/build/ /usr/share/nginx/html/
ADD default.conf /etc/nginx/conf.d/

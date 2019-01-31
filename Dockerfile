FROM node:10-alpine as builder

WORKDIR /franz-manager

COPY package*.json ./
RUN npm i --prod --no-optional

COPY . .
RUN npm run build


FROM nginx:stable-alpine

ENV APP franz-manager
ENV BASE_NGINX /usr/share/nginx/html

COPY --from=builder /$APP/dist/ ${BASE_NGINX}/${APP}/
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY replace_constants.sh .

CMD sh replace_constants.sh && nginx -g 'daemon off;'

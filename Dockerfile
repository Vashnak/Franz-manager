FROM nginx:alpine

ENV APP franz-manager
ENV BASE_NGINX /usr/share/nginx/html

COPY ./ /$APP/
COPY deploy.js /

RUN apk update \
    && apk add --update nodejs \
    && cd /$APP \
    && npm install \
    && npm rebuild node-sass --force \
    && npm run build \
    && mkdir -p ${BASE_NGINX}/ \
    && mv -f dist ${BASE_NGINX}/$APP \
    && mv -f index.html ${BASE_NGINX}/$APP \
    && cp nginx.conf /etc/nginx/conf.d/default.conf \
    && chmod -R 755 ${BASE_NGINX}

CMD node /deploy.js && nginx -g 'daemon off;'

# --------- STAGE 1: Build Angular ---------
FROM node:18 AS builder

WORKDIR /app
COPY . .

RUN npm install && npm run build -- --configuration production

FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist/balancer /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

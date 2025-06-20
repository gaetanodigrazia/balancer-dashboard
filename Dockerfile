# --------- STAGE 1: Build Angular ---------
FROM node:18 AS builder

WORKDIR /app
COPY . .

# Installa dipendenze e builda il progetto
RUN npm install && npm run build -- --configuration production

# --------- STAGE 2: Serve tramite NGINX ---------
FROM nginx:alpine

# Rimuove default NGINX html
RUN rm -rf /usr/share/nginx/html/*

# Copia il build Angular
COPY --from=builder /app/dist/balancer /usr/share/nginx/html

# (Opzionale) Gestione routing Angular: fallback su index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Espone la porta
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

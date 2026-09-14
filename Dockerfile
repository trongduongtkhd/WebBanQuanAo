# Giai đoạn 1: build Angular.
FROM node:14-bullseye AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build -- --configuration production


# Giai đoạn 2: Nginx chỉ phục vụ file Angular đã build.
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/shop-clothing-ui /usr/share/nginx/html

EXPOSE 80
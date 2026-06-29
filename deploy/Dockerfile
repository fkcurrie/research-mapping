# Stage 1: Build React application
FROM node:20-alpine AS build
WORKDIR /app
COPY portal/package*.json ./
RUN npm install
COPY portal/ ./
RUN npm run build

# Stage 2: Serve React application with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

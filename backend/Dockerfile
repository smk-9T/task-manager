# --- Stage 1: Build React Assets ---
FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

# Compile optimized static files
RUN npm run build

# --- Stage 2: Serve via Nginx ---
FROM nginx:alpine

# Remove default nginx server configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy customized Nginx server routing configurations
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build static output from Stage 1 to Nginx directory
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Stage 1: Build the application
FROM node:18-alpine as builder

WORKDIR /app

# Define build arguments
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_API_BASE_URL

# Set them as environment variables during the build
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package.json package-lock.json ./
# Use npm install instead of npm ci to generate/update the lockfile if needed
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build output to replace the default nginx contents.
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

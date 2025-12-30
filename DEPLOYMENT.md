# Deployment Guide for Wagy Web App

This guide covers two common ways to deploy your React application:
1. **Docker (Recommended for custom servers/VPS)**
2. **Static Hosting (Vercel, Netlify, etc.)**

## Option 1: Docker Deployment

We have included a `Dockerfile` and `nginx.conf` to containerize the application. This uses a multi-stage build to compile the React app and then serves it using Nginx.

### Prerequisites
- Docker installed on your machine or server.
- Docker Compose (optional but recommended).

### Method A: Using Docker Compose (Easiest)

We have included a `docker-compose.yml` file for easy management.

1. **Start the application:**
   ```bash
   docker-compose up -d --build
   ```
   The `-d` flag runs it in the background (detached mode).

2. **Stop the application:**
   ```bash
   docker-compose down
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f
   ```

### Method B: Using Docker CLI

1. **Build the Docker Image:**
   ```bash
   docker build -t wagyweb .
   ```

   *Note: If you have environment variables, pass them as build args:*
   ```bash
   docker build --build-arg VITE_API_BASE_URL=https://api.yourdomain.com -t wagyweb .
   ```

2. **Run the Container:**
   Run the container mapping port 80 of the container to port 80 on your host:
   ```bash
   docker run -d -p 80:80 --restart always --name wagy-app wagyweb
   ```

3. **Stop and Remove:**
   ```bash
   docker stop wagy-app
   docker rm wagy-app
   ```

---

## Option 2: Static Hosting (Vercel/Netlify)

Since this is a static React application, services like Vercel or Netlify are often the easiest and fastest way to deploy.

### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project root.
3. Follow the prompts. Vercel will automatically detect Vite and configure the build settings.

### Netlify
1. Drag and drop the `dist` folder (created after running `npm run build`) into the Netlify dashboard.
2. Or connect your Git repository to Netlify for continuous deployment.
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`

## Option 3: Traditional Web Server (Apache/Nginx)

If you already have a web server set up:

1. Run `npm run build` locally.
2. Copy the contents of the `dist` folder to your server's web root (e.g., `/var/www/html`).
3. Ensure your server is configured to handle Single Page Application (SPA) routing (redirecting all 404s to `index.html`).
   - *See the provided `nginx.conf` for an example Nginx configuration.*

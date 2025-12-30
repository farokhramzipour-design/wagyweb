# Deployment Guide for Wagy Web App

This guide covers two common ways to deploy your React application:
1. **Docker (Recommended for custom servers/VPS)**
2. **Static Hosting (Vercel, Netlify, etc.)**

## Option 1: Docker Deployment

We have included a `Dockerfile` and `nginx.conf` to containerize the application. This uses a multi-stage build to compile the React app and then serves it using Nginx.

### Prerequisites
- Docker installed on your machine or server.

### Step 1: Build the Docker Image

Run the following command in the root of your project:

```bash
docker build -t wagyweb .
```

**Note on Environment Variables:**
If you have environment variables (like `VITE_API_BASE_URL`), you need to pass them during the build process because Vite bakes them into the static files.

```bash
docker build --build-arg VITE_API_BASE_URL=https://api.yourdomain.com -t wagyweb .
```
*You may need to modify the Dockerfile to accept these ARGs if you use this method.*

### Step 2: Run the Container

Run the container mapping port 80 of the container to a port on your host (e.g., 8080):

```bash
docker run -d -p 8080:80 --name wagy-app wagyweb
```

Visit `http://localhost:8080` to see your app.

### Step 3: Deploy to a Server (e.g., DigitalOcean, AWS EC2)

1. **Push to a Registry:**
   Tag and push your image to Docker Hub or a private registry.
   ```bash
   docker tag wagyweb yourusername/wagyweb:latest
   docker push yourusername/wagyweb:latest
   ```

2. **Pull and Run on Server:**
   SSH into your server and run:
   ```bash
   docker pull yourusername/wagyweb:latest
   docker run -d -p 80:80 --restart always --name wagy-app yourusername/wagyweb:latest
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

# 🚀 QuantumChat Deployment Guide

This guide covers different deployment options for the QuantumChat application.

## 📋 Prerequisites

- Node.js 16+ and npm 8+
- Git
- A web server or cloud platform

## 🏠 Local Development

### Quick Start
```bash
git clone <repository-url>
cd quantumchat
npm install
npm start
```

### Development Mode
```bash
npm run dev          # Auto-restart on file changes
npm run dev-frontend # Live reload for frontend
```

## ☁️ Cloud Deployment

### Heroku

1. **Create Heroku app**
   ```bash
   heroku create your-quantumchat-app
   ```

2. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

### Railway

1. **Connect repository to Railway**
2. **Set environment variables**
   - `NODE_ENV=production`
   - `PORT=3000` (auto-assigned)

### Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

### DigitalOcean App Platform

1. **Connect GitHub repository**
2. **Configure build settings**
   - Build Command: `npm install`
   - Run Command: `npm start`
   - Environment: Node.js

## 🐳 Docker Deployment

### Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Build and Run
```bash
docker build -t quantumchat .
docker run -p 3000:3000 quantumchat
```

### Docker Compose
```yaml
version: '3.8'
services:
  quantumchat:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

## 🔧 Environment Configuration

### Production Environment Variables
```bash
NODE_ENV=production
PORT=3000
```

### Security Considerations
- Use HTTPS in production
- Set up proper CORS configuration
- Implement rate limiting
- Add monitoring and logging

## 📊 Monitoring

### Health Check Endpoint
```bash
curl http://your-domain/api/status
```

### Security Information
```bash
curl http://your-domain/api/security
```

## 🔒 SSL/HTTPS Setup

### Let's Encrypt (Recommended)
```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Configure nginx or other reverse proxy
```

### Reverse Proxy with Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🧪 Testing Deployment

### Automated Testing
```bash
npm test
```

### Manual Testing
1. Open application in browser
2. Check WebSocket connection
3. Test message encryption/decryption
4. Verify security status display

## 📈 Performance Optimization

### Production Build
- Use PM2 for process management
- Enable gzip compression
- Set up CDN for static assets
- Implement caching strategies

### PM2 Configuration
```bash
npm install -g pm2
pm2 start src/backend/server.js --name quantumchat
pm2 startup
pm2 save
```

## 🔍 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   lsof -i :3000
   kill -9 <PID>
   ```

2. **WebSocket connection failed**
   - Check firewall settings
   - Verify reverse proxy configuration
   - Ensure HTTPS is properly configured

3. **Memory issues**
   - Monitor with `pm2 monit`
   - Increase Node.js memory limit: `node --max-old-space-size=4096`

### Logs
```bash
# Application logs
npm start 2>&1 | tee app.log

# PM2 logs
pm2 logs quantumchat

# System logs
journalctl -u quantumchat -f
```

## 📞 Support

For deployment issues:
1. Check the logs
2. Verify environment configuration
3. Test locally first
4. Review security settings

---

**Remember**: Always test thoroughly in a staging environment before deploying to production! 🛡️ 
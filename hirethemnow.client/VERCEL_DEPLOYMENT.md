# Vercel Deployment Guide

This document provides instructions for deploying the HireThemNow frontend to Vercel.

## Prerequisites

1. **Vercel Account**: Create an account at [vercel.com](https://vercel.com)
2. **GitHub Integration**: Connect your GitHub account to Vercel
3. **Vercel CLI**: Install globally with `npm install -g vercel`

## Initial Setup

### 1. Connect GitHub Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the `hirethemnow.client` directory as the root directory

### 2. Configure Project Settings

**Framework Preset**: Vite
**Build Command**: `npm run build:production`
**Output Directory**: `dist`
**Install Command**: `npm ci`

### 3. Environment Variables

Set these environment variables in Vercel Dashboard:

#### Production Environment
```
VITE_APP_ENV=production
VITE_API_URL=https://api.hirethemnow.xyz/api
VITE_APP_NAME=HireThemNow
VITE_BACKEND_URL=https://api.hirethemnow.xyz
VITE_API_BASE_URL=https://api.hirethemnow.xyz/api
VITE_ENABLE_DEBUG=false
VITE_ENABLE_MOCK_DATA=false
VITE_LOG_LEVEL=error
VITE_GOOGLE_CLIENT_ID=419725254966-5i7rgg3h7j984od6mi3ib4tt3rqq8o4j.apps.googleusercontent.com
```

#### Preview Environment
```
VITE_APP_ENV=preview
VITE_API_URL=https://api.hirethemnow.xyz/api
VITE_APP_NAME=HireThemNow (Preview)
VITE_BACKEND_URL=https://api.hirethemnow.xyz
VITE_API_BASE_URL=https://api.hirethemnow.xyz/api
VITE_ENABLE_DEBUG=true
VITE_ENABLE_MOCK_DATA=false
VITE_LOG_LEVEL=info
VITE_GOOGLE_CLIENT_ID=419725254966-5i7rgg3h7j984od6mi3ib4tt3rqq8o4j.apps.googleusercontent.com
```

## Deployment Methods

### Method 1: Automatic Deployment (Recommended)

1. Push code to `main` branch → Automatic production deployment
2. Create pull request → Automatic preview deployment
3. Push to other branches → Preview deployment

### Method 2: Manual Deployment via CLI

```powershell
# Deploy to preview
.\deploy-frontend-vercel.ps1 -Preview

# Deploy to production
.\deploy-frontend-vercel.ps1 -Environment production

# Install Vercel CLI and deploy
.\deploy-frontend-vercel.ps1 -Install -Environment production
```

### Method 3: Direct Vercel CLI

```bash
# Navigate to frontend directory
cd hirethemnow.client

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Custom Domain Setup

### 1. Add Domain in Vercel

1. Go to Project Settings → Domains
2. Add `hirethemnow.xyz`
3. Add `www.hirethemnow.xyz`

### 2. DNS Configuration

Add these DNS records at your domain registrar:

```
Type: A
Name: @
Value: 76.76.19.61
TTL: 3600

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

### 3. SSL Certificate

Vercel automatically provisions SSL certificates for custom domains.

## Build Configuration

The project uses these build settings:

- **Build Command**: `npm run build:production`
- **Output Directory**: `dist`
- **Node.js Version**: 18.x (latest LTS)
- **Package Manager**: npm

## Environment-Specific Builds

- **Production**: Uses `.env.production` with optimized settings
- **Preview**: Uses `.env.preview` with debug enabled
- **Development**: Uses `.env.development` for local development

## Troubleshooting

### Build Failures

1. **TypeScript Errors**: Fix type errors before deployment
2. **Linting Issues**: Run `npm run lint:fix`
3. **Dependency Issues**: Delete `node_modules` and run `npm ci`

### Runtime Issues

1. **API Connection**: Verify environment variables
2. **Routing Issues**: Check `vercel.json` SPA configuration
3. **CORS Errors**: Verify API CORS settings

### Performance Issues

1. **Bundle Size**: Check chunk splitting in `vite.config.ts`
2. **Loading Speed**: Optimize images and assets
3. **Caching**: Verify Vercel caching headers

## Monitoring

### Vercel Analytics

Enable Vercel Analytics in project settings for:
- Page views and performance metrics
- Core Web Vitals tracking
- Real user monitoring

### Build Logs

Access build logs in Vercel Dashboard:
1. Go to Deployments tab
2. Click on specific deployment
3. View build logs and runtime logs

## Rollback Procedure

### Via Vercel Dashboard

1. Go to Deployments tab
2. Find previous successful deployment
3. Click "Promote to Production"

### Via CLI

```bash
# List deployments
vercel ls

# Promote specific deployment
vercel promote <deployment-url>
```

## Cost Optimization

### Vercel Pricing

- **Hobby Plan**: Free (sufficient for current usage)
- **Pro Plan**: $20/month (if advanced features needed)

### Optimization Tips

1. **Image Optimization**: Use Vercel's built-in image optimization
2. **Edge Caching**: Leverage Vercel's global CDN
3. **Bundle Splitting**: Optimize chunk sizes
4. **Compression**: Automatic gzip/brotli compression

## Security

### Environment Variables

- Never commit `.env` files to Git
- Use Vercel Dashboard for sensitive variables
- Rotate secrets regularly

### HTTPS

- Automatic SSL certificate provisioning
- HTTP to HTTPS redirects enabled
- HSTS headers configured

## Support

For deployment issues:
1. Check Vercel documentation
2. Review build logs in dashboard
3. Test locally with `npm run build && npm run preview`
4. Contact team for assistance
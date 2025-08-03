# Deployment Guide

## Deploy Your Student Certificate Generator

### 1. Vercel (Recommended - Easiest)

Vercel is the company behind Next.js and offers the best Next.js hosting experience.

#### Steps:
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Sign in with your GitHub account
3. Click **"Add New Project"**
4. Import your `student-certificate-generator` repository
5. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
6. Click **"Deploy"**

**Your app will be live at**: `https://your-project-name.vercel.app`

#### Environment Variables (if needed):
- Go to Project Settings → Environment Variables
- Add any required environment variables

### 2. Netlify

#### Steps:
1. Go to [netlify.com](https://netlify.com)
2. Sign up/Sign in with your GitHub account
3. Click **"Add new site"** → **"Import an existing project"**
4. Choose GitHub and select your repository
5. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `out`
6. Add to `next.config.mjs`:
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'export',
     trailingSlash: true,
     images: {
       unoptimized: true
     }
   }
   
   export default nextConfig
   ```
7. Click **"Deploy site"**

### 3. GitHub Pages (Static Export)

#### Step 1: Modify next.config.mjs
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: process.env.NODE_ENV === 'production' ? '/student-certificate-generator' : ''
}

export default nextConfig
```

#### Step 2: Add GitHub Actions
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./out
```

#### Step 3: Enable Pages
1. Repository → Settings → Pages
2. Source: GitHub Actions

### 4. Railway

#### Steps:
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your repository
5. Railway will auto-detect Next.js and deploy

### 5. Render

#### Steps:
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click **"New"** → **"Static Site"**
4. Connect your repository
5. Configure:
   - **Build Command**: `npm run build && npm run export`
   - **Publish Directory**: `out`

## Custom Domain (Optional)

### For Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as shown

### For Netlify:
1. Go to Site Settings → Domain Management
2. Add custom domain
3. Configure DNS records

## Environment Variables

If your app needs environment variables:

### Common Variables:
```env
# Database (if using)
DATABASE_URL=your_database_url

# Email (if using)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password

# File Storage (if using)
CLOUDINARY_URL=your_cloudinary_url
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
```

## Performance Tips

1. **Optimize Images**: Use Next.js Image component
2. **Enable Compression**: Most platforms enable this by default
3. **CDN**: Vercel and Netlify provide global CDN automatically
4. **Caching**: Configure proper cache headers

## Monitoring

### Vercel Analytics:
- Enable in Project Settings → Analytics
- View performance metrics

### Google Analytics:
Add to your `layout.tsx`:
```tsx
import Script from 'next/script'

// Add in <head>
<Script
  src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
  strategy="afterInteractive"
/>
```

Your Student Certificate Generator is now ready for production! 🚀

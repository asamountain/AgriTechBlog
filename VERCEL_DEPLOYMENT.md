# Deploy AgroTech Blog to Vercel

## Quick Start

1. **Push to GitHub**
```bash
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

2. **Connect to Vercel**
   - Visit [vercel.com](https://vercel.com) and sign in
   - Click "New Project"
   - Import your GitHub repository
   - Use these settings:
     - Framework: **Other**
     - Build Command: `npm run build`
     - Output Directory: `dist`

3. **Add Environment Variables**
   In Vercel dashboard → Settings → Environment Variables:
   ```
   DATABASE_URL=your_mongodb_connection_string
   VITE_GA_MEASUREMENT_ID=G-LM04J3WC3L
   SESSION_SECRET=your_random_32_character_string
   GOOGLE_CLIENT_ID=your_google_oauth_client_id
   GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
   NODE_ENV=production
   ```

4. **Deploy**
   Click "Deploy" - Vercel will build and deploy automatically.

## Required Setup After Deployment

### Update OAuth Settings
Add your Vercel domain to Google OAuth:
- Google Console → APIs & Services → Credentials
- Add `https://your-app.vercel.app/auth/google/callback` to redirect URIs

### Update SEO URLs
Replace the hardcoded domain in `client/index.html`:
```html
<!-- Change this -->
<meta property="og:url" content="https://your-app.vercel.app" />
<link rel="canonical" href="https://your-app.vercel.app" />
```

## Testing Checklist

After deployment:
- [ ] Homepage loads correctly
- [ ] Google Analytics tracking works
- [ ] Blog posts display properly
- [ ] Admin login functions
- [ ] Blog post creation/editing works
- [ ] Google Search Console verification accessible
- [ ] Sitemap.xml generates properly

## Common Issues

**Build fails**: Ensure all dependencies are in package.json
**API errors**: Check environment variables are set correctly
**Auth not working**: Verify OAuth redirect URIs match your domain
**Database issues**: Confirm DATABASE_URL is accessible from Vercel

## Alternative: CLI Deployment

```bash
npm i -g vercel
vercel
# Follow prompts to configure project
```

Your blog will be live at `https://your-project-name.vercel.app`
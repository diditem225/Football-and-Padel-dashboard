# 🚀 Deployment Guide

Complete guide to deploy your Sports Complex Booking System online.

---

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ **Supabase project** set up and running
- ✅ **Database migrations** applied
- ✅ **Edge Functions** deployed
- ✅ **Admin user** created
- ✅ **Git repository** (for deployment platforms)

---

## 🎯 Recommended Platforms

### **Option 1: Vercel (Recommended)** ⭐
- **Best for:** React/Vite apps
- **Free tier:** Yes
- **Deploy time:** 2-3 minutes
- **Custom domain:** Yes (free)

### **Option 2: Netlify**
- **Best for:** Static sites
- **Free tier:** Yes
- **Deploy time:** 2-3 minutes
- **Custom domain:** Yes (free)

### **Option 3: Render**
- **Best for:** Full-stack apps
- **Free tier:** Yes (with limitations)
- **Deploy time:** 5-10 minutes
- **Custom domain:** Yes (paid)

---

## 🚀 Deploy with Vercel (Fastest)

### **Step 1: Install Vercel CLI**

```cmd
npm install -g vercel
```

### **Step 2: Login to Vercel**

```cmd
vercel login
```

Follow the prompts to authenticate.

### **Step 3: Deploy**

```cmd
:: Navigate to project root
cd path\to\sports-complex-booking

:: Deploy
vercel
```

**During deployment, answer:**
- Set up and deploy? **Y**
- Which scope? **Select your account**
- Link to existing project? **N**
- Project name? **sports-booking** (or your choice)
- Directory? **./frontend**
- Override settings? **N**

### **Step 4: Add Environment Variables**

```cmd
:: Add Supabase URL
vercel env add VITE_SUPABASE_URL

:: Add Supabase Anon Key
vercel env add VITE_SUPABASE_ANON_KEY

:: Add App URL (use your Vercel URL)
vercel env add VITE_APP_URL

:: Add Environment
vercel env add VITE_ENVIRONMENT
```

For each command:
- Select: **Production**
- Paste the value
- Press Enter

### **Step 5: Redeploy with Environment Variables**

```cmd
vercel --prod
```

**Your site is now live!** 🎉

You'll get a URL like: `https://sports-booking-xxxxx.vercel.app`

---

## 🌐 Deploy with Netlify

### **Step 1: Install Netlify CLI**

```cmd
npm install -g netlify-cli
```

### **Step 2: Login to Netlify**

```cmd
netlify login
```

### **Step 3: Build the Project**

```cmd
cd frontend
npm install
npm run build
```

### **Step 4: Deploy**

```cmd
:: Initialize Netlify
netlify init

:: Deploy to production
netlify deploy --prod
```

**During deployment:**
- Create & configure a new site? **Y**
- Team? **Select your team**
- Site name? **sports-booking** (or your choice)
- Publish directory? **frontend/dist**

### **Step 5: Add Environment Variables**

Go to Netlify Dashboard:
1. Select your site
2. Go to **Site settings** > **Environment variables**
3. Add these variables:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - `VITE_APP_URL` = your Netlify URL
   - `VITE_ENVIRONMENT` = production

4. Click **Save**
5. Go to **Deploys** > **Trigger deploy** > **Deploy site**

**Your site is now live!** 🎉

---

## 🖱️ Deploy via Web UI (No CLI)

### **Vercel (Web)**

1. Go to https://vercel.com
2. Click **Add New** > **Project**
3. Import your Git repository
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add environment variables (see Step 4 above)
6. Click **Deploy**

### **Netlify (Web)**

1. Go to https://netlify.com
2. Click **Add new site** > **Import an existing project**
3. Connect your Git repository
4. Configure:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
5. Add environment variables (see Step 5 above)
6. Click **Deploy site**

---

## 🔧 Post-Deployment Setup

### **1. Update Supabase Allowed URLs**

Go to Supabase Dashboard:
1. **Authentication** > **URL Configuration**
2. Add your deployment URL to:
   - **Site URL:** `https://your-app.vercel.app`
   - **Redirect URLs:** `https://your-app.vercel.app/**`
3. Click **Save**

### **2. Update CORS Settings**

If using Edge Functions, update CORS headers:

```typescript
// In your Edge Functions
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-app.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### **3. Test Your Deployment**

Visit your live URL and test:
- ✅ User registration
- ✅ Login/logout
- ✅ Create booking
- ✅ View dashboard
- ✅ Admin access
- ✅ Mobile responsiveness

---

## 🎨 Custom Domain (Optional)

### **Vercel**

```cmd
vercel domains add yourdomain.com
```

Then add DNS records as instructed.

### **Netlify**

1. Go to **Domain settings**
2. Click **Add custom domain**
3. Follow DNS configuration steps

---

## 📊 Monitoring & Analytics

### **Vercel Analytics**

```cmd
npm install @vercel/analytics
```

Add to `frontend/src/main.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react';

// In your root component
<Analytics />
```

### **Netlify Analytics**

Enable in Netlify Dashboard:
1. Go to **Analytics** tab
2. Click **Enable Analytics**

---

## 🐛 Troubleshooting

### **Build Fails**

```cmd
:: Clear cache and rebuild
cd frontend
rmdir /s /q node_modules
rmdir /s /q dist
npm install
npm run build
```

### **Environment Variables Not Working**

- Ensure variables start with `VITE_`
- Redeploy after adding variables
- Check variable names match exactly

### **404 Errors on Refresh**

- Ensure SPA redirect rules are configured
- Check `vercel.json` or `netlify.toml` exists
- Verify rewrites/redirects are set up

### **Supabase Connection Issues**

- Verify environment variables are correct
- Check Supabase allowed URLs
- Ensure Edge Functions are deployed
- Check browser console for errors

---

## 🔄 Continuous Deployment

Both Vercel and Netlify support automatic deployments:

1. **Connect Git repository**
2. **Push to main branch**
3. **Automatic deployment triggered**

Configure in platform settings:
- **Production branch:** `main`
- **Deploy previews:** Enable for pull requests
- **Build settings:** Already configured

---

## 📈 Performance Optimization

### **1. Enable Caching**

Already configured in `vercel.json` and `netlify.toml`

### **2. Optimize Images**

Use Vercel Image Optimization or Netlify Image CDN

### **3. Enable Compression**

Automatically enabled on both platforms

### **4. Monitor Performance**

- Vercel: Built-in Speed Insights
- Netlify: Analytics dashboard
- Google Lighthouse: Run audits

---

## 💰 Cost Estimate

### **Free Tier Limits:**

**Vercel:**
- 100 GB bandwidth/month
- Unlimited deployments
- 100 GB-hours serverless execution

**Netlify:**
- 100 GB bandwidth/month
- 300 build minutes/month
- Unlimited sites

**Supabase:**
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth

**For production:** Expect $0-25/month depending on traffic

---

## ✅ Deployment Checklist

- [ ] Supabase project configured
- [ ] Database migrations applied
- [ ] Edge Functions deployed
- [ ] Environment variables set
- [ ] Build succeeds locally
- [ ] Git repository created
- [ ] Platform account created
- [ ] Project deployed
- [ ] Environment variables added
- [ ] Supabase URLs updated
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] All features tested
- [ ] Mobile tested
- [ ] Performance checked

---

## 🎉 Success!

Your Sports Complex Booking System is now live!

**Next Steps:**
1. Share the URL with stakeholders
2. Monitor analytics and errors
3. Set up monitoring alerts
4. Plan feature updates
5. Gather user feedback

---

## 📞 Support

**Issues?**
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Review platform documentation
- Check browser console for errors
- Verify Supabase dashboard for backend issues

**Platform Documentation:**
- Vercel: https://vercel.com/docs
- Netlify: https://docs.netlify.com
- Supabase: https://supabase.com/docs

---

**🚀 Happy Deploying!**

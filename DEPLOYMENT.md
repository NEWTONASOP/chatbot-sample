# Deployment Guide

## Option 1: Cloudflare Pages (Recommended) ⭐

Cloudflare Pages is the best choice for this project because it:
- Hosts your static frontend automatically
- Runs your `/functions` as Workers (no extra config needed)
- Provides free SSL, CDN, and unlimited bandwidth
- Offers Git integration with auto-deployments

### Step-by-Step Deployment

#### 1. Build Your Project
```bash
npm run build
```

#### 2. Deploy to Cloudflare Pages

**Option A: Using Wrangler CLI (Fastest)**
```bash
# First time setup
npx wrangler login

# Deploy
npm run deploy

# Follow the prompts to create a new Pages project
```

**Option B: Using Cloudflare Dashboard (Recommended for Git integration)**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** → **Create a project**
3. Connect your Git repository (GitHub/GitLab)
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty)
5. Click **Save and Deploy**

#### 3. Configure Environment Variables

After deployment, add your API keys:

1. Go to your Pages project
2. Navigate to **Settings** → **Environment variables**
3. Add these variables for **Production**:
   ```
   NVIDIA_API_KEY = your_nvidia_api_key
   PEXELS_API_KEY = your_pexels_api_key
   CALCOM_API_KEY = your_calcom_api_key (optional)
   CALCOM_EVENT_TYPE_ID = your_event_type_id (optional)
   ```
4. Click **Save**
5. Redeploy your project (Settings → Deployments → Retry deployment)

#### 4. Test Your Deployment

Visit your Pages URL (e.g., `https://travel-ai-chatbot.pages.dev`) and test:
- ✅ Chat functionality
- ✅ Image loading
- ✅ Calendar widget (if configured)

### How Pages + Functions Work

```
Your Project Structure:
├── dist/                    → Hosted as static site on Pages
│   ├── index.html
│   ├── assets/
│   └── ...
└── functions/               → Automatically deployed as Workers
    └── v1/
        ├── nvidia/
        ├── pexels/
        └── calcom/

URL Routing:
- https://your-site.pages.dev/           → Static frontend
- https://your-site.pages.dev/v1/nvidia/ → Worker function
- https://your-site.pages.dev/v1/pexels/ → Worker function
```

---

## Option 2: Cloudflare Workers (Advanced)

If you want to deploy ONLY the Workers (without Pages), you can use standalone Workers deployment.

### When to Use Workers Only
- You're hosting the frontend elsewhere (Vercel, Netlify, etc.)
- You only need the API proxy functions
- You want more control over routing

### Deployment Steps

1. **Update wrangler.toml** for Workers mode:
```toml
name = "travel-ai-chatbot-api"
main = "functions/v1/nvidia/chat/completions.ts"
compatibility_date = "2024-01-01"

[[routes]]
pattern = "your-domain.com/v1/*"
```

2. **Deploy each function separately**:
```bash
npx wrangler deploy functions/v1/nvidia/chat/completions.ts --name nvidia-api
npx wrangler deploy functions/v1/pexels/search.ts --name pexels-api
npx wrangler deploy functions/v1/calcom/slots.ts --name calcom-slots-api
npx wrangler deploy functions/v1/calcom/bookings.ts --name calcom-bookings-api
```

3. **Set secrets for each Worker**:
```bash
npx wrangler secret put NVIDIA_API_KEY --name nvidia-api
npx wrangler secret put PEXELS_API_KEY --name pexels-api
npx wrangler secret put CALCOM_API_KEY --name calcom-slots-api
npx wrangler secret put CALCOM_API_KEY --name calcom-bookings-api
```

4. **Update frontend API URLs** in `src/config.js` to point to your Worker URLs

---

## Option 3: Other Hosting Platforms

### Vercel
```bash
npm install -g vercel
vercel
```
- Add environment variables in Vercel dashboard
- Note: You'll need to set up Vercel Functions or use Cloudflare Workers for API proxying

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```
- Add environment variables in Netlify dashboard
- Note: You'll need to set up Netlify Functions or use Cloudflare Workers for API proxying

### GitHub Pages (Not Recommended)
- ❌ No server-side functions support
- ❌ Cannot hide API keys
- ❌ Would expose your keys to the public

---

## Comparison Table

| Feature | Pages | Workers Only | Vercel | Netlify |
|---------|-------|--------------|--------|---------|
| Static Hosting | ✅ Free | ❌ Need separate | ✅ Free | ✅ Free |
| API Functions | ✅ Included | ✅ Yes | ✅ Yes | ✅ Yes |
| Setup Complexity | ⭐ Easy | ⭐⭐ Medium | ⭐ Easy | ⭐ Easy |
| Git Integration | ✅ Yes | ❌ Manual | ✅ Yes | ✅ Yes |
| Custom Domain | ✅ Free | ✅ Free | ✅ Free | ✅ Free |
| Edge Network | ✅ Global | ✅ Global | ✅ Global | ✅ Global |
| Best For | This project! | API-only | Full-stack | Full-stack |

---

## Recommended: Cloudflare Pages

For this specific project, **Cloudflare Pages is the best choice** because:

1. ✅ **One-click deployment** - Everything works together
2. ✅ **No configuration needed** - Functions auto-deploy from `/functions`
3. ✅ **Free tier is generous** - Unlimited bandwidth, 500 builds/month
4. ✅ **Fast global CDN** - Your site loads quickly worldwide
5. ✅ **Git integration** - Auto-deploy on every push
6. ✅ **Preview deployments** - Test branches before merging

### Quick Start Command
```bash
npm run build && npm run deploy
```

That's it! Your chatbot will be live in under 2 minutes. 🚀

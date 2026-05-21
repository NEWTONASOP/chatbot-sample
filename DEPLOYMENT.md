# Deployment Guide - Cloudflare Workers

This project is configured to deploy as a **Cloudflare Worker** with static assets.

## Quick Deploy

```bash
# 1. Build the project
npm run build

# 2. Login to Cloudflare (first time only)
npx wrangler login

# 3. Deploy
npm run deploy
```

## Setup Environment Variables

After your first deployment, set your API keys:

```bash
# Set OpenRouter API key
npx wrangler secret put OPENROUTER_API_KEY

# Set Groq API key (Optional)
npx wrangler secret put GROQ_API_KEY

# Set Pexels API key
npx wrangler secret put PEXELS_API_KEY

# Set Cal.com API key (optional)
npx wrangler secret put CALCOM_API_KEY

# Set Cal.com Event Type ID (optional)
npx wrangler secret put CALCOM_EVENT_TYPE_ID
```

## Local Development

```bash
# Start local dev server with Wrangler
npm run dev
```

This will:
- Start Vite dev server for frontend
- Run Cloudflare Worker locally
- Use environment variables from `.env` file

## Project Structure

```
travel-ai-chatbot/
├── worker/
│   └── index.js              # Main Worker entry point (handles API routes)
├── src/                      # Frontend source code
│   ├── ai-service.js
│   ├── api.js
│   ├── chatbot.js
│   ├── config.js
│   ├── ui.js
│   └── utils.js
├── dist/                     # Built static assets (served by Worker)
├── wrangler.toml            # Worker configuration
└── package.json
```

## How It Works

1. **Static Assets**: Your frontend (HTML, CSS, JS) is built to `dist/` and served by the Worker
2. **API Routes**: All `/v1/*` routes are handled by the Worker's API handlers
3. **Environment Variables**: API keys are stored as Worker secrets (not in code)

## API Routes

The Worker handles these routes:

- `POST /v1/openrouter/chat/completions` - OpenRouter AI API proxy
- `POST /v1/groq/chat/completions` - Groq AI API proxy (Optional)
- `GET /v1/pexels/search` - Pexels image search proxy
- `GET /v1/calcom/slots` - Cal.com availability slots
- `POST /v1/calcom/bookings` - Cal.com booking creation

## Custom Domain (Optional)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → Your worker
3. Click **Settings** → **Domains & Routes**
4. Add your custom domain

## Monitoring

View logs and analytics:
```bash
npx wrangler tail
```

Or visit the Cloudflare Dashboard → Workers & Pages → Your worker → Logs

## Troubleshooting

### Error: "Missing API key"
Make sure you've set all required secrets:
```bash
npx wrangler secret list
```

### Local dev not working
Ensure your `.env` file has all required keys:
```
OPENROUTER_API_KEY=your_key_here
PEXELS_API_KEY=your_key_here
```

### Deployment fails
Check your `wrangler.toml` configuration and ensure you're logged in:
```bash
npx wrangler whoami
```

## Cost

Cloudflare Workers Free Tier includes:
- ✅ 100,000 requests/day
- ✅ Unlimited bandwidth
- ✅ Global edge network
- ✅ Custom domains

Perfect for this chatbot project! 🚀

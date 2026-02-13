# Deployment Guide

This guide will help you deploy NextStop to Vercel.

## Prerequisites

- GitHub account
- Vercel account (free tier is sufficient)
- Neon Postgres account (free tier available)
- Upstash Redis account (free tier available)
- OpenAI API account (for AI features)

## Step 1: Set Up Database (Neon Postgres)

1. Go to [Neon Console](https://console.neon.tech/)
2. Click "Create Project"
3. Choose a name for your project
4. Select a region close to your users
5. Copy the connection string (starts with `postgresql://`)
6. Save this as your `DATABASE_URL`

## Step 2: Set Up Redis (Upstash)

1. Go to [Upstash Console](https://console.upstash.com/)
2. Click "Create Database"
3. Choose a name and select a region
4. Click "Create"
5. Go to the "REST API" tab
6. Copy the `KV_REST_API_URL` (or `UPSTASH_REDIS_REST_URL`)
7. Copy the `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_TOKEN`)

## Step 3: Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the key (save it - you won't see it again!)
6. This is your `OPENAI_API_KEY`

## Step 4: Generate Auth Secret

Generate a secure random string for `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

Or use any password generator to create a long, random string.

## Step 5: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `app` (⚠️ **IMPORTANT**: This must be set correctly for the build to succeed)
   - **Build Command**: Leave empty (will use default from package.json)
   - **Install Command**: Leave empty (will use default)
   - **Output Directory**: Leave empty (will use default `.next`)

5. Add Environment Variables:

```bash
DATABASE_URL=postgresql://[your-neon-connection-string]
KV_REST_API_URL=https://[your-upstash-url]
KV_REST_API_TOKEN=[your-upstash-token]
OPENAI_API_KEY=sk-[your-openai-key]
NEXTAUTH_SECRET=[your-generated-secret]
NEXTAUTH_URL=https://[your-app].vercel.app
```

6. Click "Deploy"

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Navigate to your project:
```bash
cd nextstop/app
```

3. Deploy:
```bash
vercel
```

4. Follow the prompts to link your project

5. Add environment variables:
```bash
vercel env add DATABASE_URL
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN
vercel env add OPENAI_API_KEY
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
```

6. Deploy to production:
```bash
vercel --prod
```

## Step 6: Initialize Database

After deployment, the database tables will be created automatically on first API call. Alternatively, you can manually run the initialization:

1. Create a temporary initialization endpoint or
2. Use a database client to run the SQL from `lib/db.ts`

## Step 7: Verify Deployment

1. Visit your deployed URL
2. Navigate to `/plans`
3. Try creating a plan
4. Add some events
5. Test the AI features

## Troubleshooting

### Build Fails

**Issue**: Build fails with "DATABASE_URL is not defined"

**Solution**: Ensure all environment variables are set in Vercel dashboard under Settings → Environment Variables

### AI Features Don't Work

**Issue**: AI analysis or suggestions fail

**Solutions**:
- Verify `OPENAI_API_KEY` is correct
- Check you have credits in your OpenAI account
- Review the API logs in Vercel

### Database Connection Fails

**Issue**: Cannot connect to database

**Solutions**:
- Verify `DATABASE_URL` is correct
- Check Neon project is active
- Ensure connection pooling is enabled

### Redis Connection Fails

**Issue**: Real-time features don't work

**Solutions**:
- Verify Upstash credentials are correct
- Check Upstash database is active
- Review connection limits

## Post-Deployment

### Set Up Custom Domain

1. In Vercel Dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions
5. Update `NEXTAUTH_URL` with your custom domain

### Monitor Performance

1. Use Vercel Analytics (free)
2. Monitor API response times
3. Check error rates
4. Review database queries

### Enable Branch Previews

Vercel automatically creates preview deployments for pull requests. Each preview gets its own URL for testing.

### Set Up Monitoring

Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- Datadog for performance monitoring

## Security Checklist

- ✅ All environment variables are set
- ✅ `NEXTAUTH_SECRET` is a strong random string
- ✅ Database credentials are secure
- ✅ API keys are not committed to git
- ✅ CORS is properly configured
- ✅ Rate limiting is considered (future)
- ✅ Input validation is in place

## Cost Estimates

**Free Tier Usage:**
- Vercel: Hobby plan (free for personal projects)
- Neon: 0.5GB storage, 1 project (free)
- Upstash: 10K commands/day (free)
- OpenAI: Pay per use (estimate $5-20/month for moderate use)

**Estimated Monthly Cost**: $5-20 (mostly OpenAI API usage)

## Scaling Considerations

When your app grows:

1. **Upgrade Database**: Neon Pro for more storage/compute
2. **Upgrade Redis**: Upstash paid tier for more commands
3. **Add Caching**: Implement Redis caching for API responses
4. **Enable CDN**: Vercel Edge Network (automatic)
5. **Database Indexing**: Add indexes for frequently queried fields
6. **Rate Limiting**: Implement API rate limiting
7. **Load Testing**: Test with expected user loads

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review API logs in Vercel dashboard
3. Check database logs in Neon
4. Review this documentation
5. Open an issue on GitHub

## Next Steps

After successful deployment:
1. Test all features thoroughly
2. Share with users for feedback
3. Monitor performance and errors
4. Plan for additional features
5. Set up CI/CD for automated testing

---

Congratulations! Your NextStop application is now live! 🎉

# FinBotGlobal AWS Deployment Guide

## Prerequisites

Before deploying, ensure you have:

1. **AWS CLI configured** with credentials that have:
   - IAM permissions to create Lambda functions, S3 buckets, CloudFront distributions
   - Bedrock model access (Claude 3.5 Sonnet) in your AWS region
   
2. **Node.js 20.x** installed

3. **MongoDB Atlas** network access configured to allow `0.0.0.0/0` or AWS IP ranges

---

## Step 1: Set SST Secrets

SST uses AWS Systems Manager Parameter Store for secrets. Run these commands in the project root:

```bash
# MongoDB
sst secret set MONGO_URI "mongodb+srv://finbot:LuU23uZak9uAPiyU@cluster0.zdjpryt.mongodb.net/finbot?appName=Cluster0"
sst secret set JWT_SECRET "finbot_cok_gizli_guvenlik_anahtari_2024"

# API Keys
sst secret set TIINGO_API_KEY "8d7674649237b42f01f6024a01e874fa3b2e9bfb"
sst secret set OPENAI_API_KEY "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"
sst secret set GEMINI_API_KEY "AIzaSyBDoqpMHAlk8aVTi0R1p9TVm3UOgFt_9lo"
sst secret set FINANCIAL_DATASETS_API_KEY "b1bf3b67-13bf-4c37-92f6-00d900bfb246"
sst secret set POLYGON_API_KEY "5dhtJnVPIwEVhD0wy0Sjk_epIxnT5h2F"
sst secret set GOOGLE_CLIENT_ID "31375613755-tu8dkeo411m0kltv4sa2bc6jbjd7cbep.apps.googleusercontent.com"

# SMTP
sst secret set SMTP_HOST "smtp.turkticaret.net"
sst secret set SMTP_PORT "587"
sst secret set SMTP_EMAIL "destek@finbot.com.tr"
sst secret set SMTP_PASSWORD "Efsun*2005"
```

**Note**: These secrets are stored per stage (dev/production). Add `--stage dev` or `--stage production` to each command if needed.

---

## Step 2: Enable Bedrock Model Access

1. Go to AWS Console → Bedrock → Model access
2. Request access to **Anthropic Claude 3.5 Sonnet v2**
3. Wait for approval (usually instant for on-demand access)

---

## Step 3: Deploy to AWS (Dev Stage)

```bash
# Install dependencies if not done
npm install

# Deploy to dev stage
npm run deploy:dev
```

This will:
- Create Lambda function with Express backend
- Deploy React frontend to S3 + CloudFront
- Set up IAM roles with Bedrock permissions
- Output URLs for API and Frontend

**Expected output:**
```
✔  Complete
   Api: https://abc123.lambda-url.us-east-1.on.aws
   Frontend: https://d1234567890.cloudfront.net
```

---

## Step 4: Update CLIENT_URL in sst.config.js

After first deployment:

1. Note the CloudFront URL from output
2. Update `sst.config.js` line ~49:
   ```javascript
   CLIENT_URL: "https://d1234567890.cloudfront.net"
   ```
3. Redeploy:
   ```bash
   npm run deploy:dev
   ```

---

## Step 5: Test Deployment

### Backend Health Check
```bash
curl https://YOUR_LAMBDA_URL/api/health
```

Expected: `{"ok":true,"timestamp":"...","env":"production"}`

### Frontend
Open CloudFront URL in browser. You should see the FinBot landing page.

### Test AI with Bedrock
1. Login/Register
2. Go to Chat
3. Send: "Apple hakkında bilgi ver"
4. Should receive AI analysis using Bedrock (check CloudWatch logs for "🔷 [Bedrock]")

---

## Step 6: Production Deployment

When ready for production:

```bash
# Set secrets for production stage
sst secret set MONGO_URI "..." --stage production
# ... repeat for all secrets

# Deploy to production
npm run deploy --stage production
```

---

## Monitoring

- **Lambda Logs**: CloudWatch Logs → `/aws/lambda/finbot-global-dev-FinBotApi`
- **Frontend**: CloudFront monitoring in AWS Console
- **Costs**: Keep an eye on Bedrock token usage (AWS Cost Explorer)

---

## Rollback

If deployment fails or you want to remove everything:

```bash
sst remove --stage dev
```

This deletes all AWS resources created by SST.

---

## Using Bedrock vs OpenAI

Currently, the code still uses OpenAI. To switch to Bedrock:

**Option 1**: Add environment variable to `sst.config.js`:
```javascript
AI_PROVIDER: "bedrock" // or "openai"
```

Then update `chatController.js` and `aiController.js` to check this variable and use `bedrockService.js` instead of OpenAI.

**Option 2**: Replace OpenAI imports directly with Bedrock service imports.

I can help implement either option once you decide on the strategy!

---

## Troubleshooting

### Error: "Access Denied" when calling Bedrock
- Check model access in AWS Bedrock console
- Verify region matches (us-east-1 in sst.config.js)
- Check Lambda execution role has bedrock:InvokeModel permission

### Error: MongoDB connection timeout
- Add `0.0.0.0/0` to MongoDB Atlas network access
- Or configure AWS PrivateLink

### Frontend shows old API URL
- Make sure `REACT_APP_API_URL` is injected during build
- Check CloudFront cache (might need invalidation)
- Verify sst.config.js has correct `api.url` in frontend environment

### High costs
- Start with 512MB Lambda memory (already configured)
- Monitor Bedrock token usage
- Consider caching AI responses (already implemented in code)

# 🚀 Pre-Deployment Checklist

## ✅ Before Running Deploy

### 1. AWS Bedrock Model Access
- [ ] Go to AWS Console → Search "Bedrock"
- [ ] Click "Model access" in left menu
- [ ] Find "Anthropic - Claude 3.5 Sonnet v2"
- [ ] Click "Edit" and request access
- [ ] Wait for approval (usually instant)

### 2. MongoDB Atlas Network Access
- [ ] Go to MongoDB Atlas Dashboard
- [ ] Navigate to Network Access
- [ ] Ensure `0.0.0.0/0` is in the IP Access List
- [ ] (This allows Lambda from any AWS IP to connect)

### 3. AWS CLI Configuration
- [ ] Run `aws configure list` to verify credentials
- [ ] Ensure region is `us-east-1`
- [ ] Ensure Access Key matches your screenshot (Access key 1)

### 4. Set SST Secrets (IMPORTANT!)
Run these commands from project root (`FinBotGlobal/FinBotGlobal`):

```bash
# Core
npx sst secret set MONGO_URI "mongodb+srv://finbot:LuU23uZak9uAPiyU@cluster0.zdjpryt.mongodb.net/finbot?appName=Cluster0"
npx sst secret set JWT_SECRET "finbot_cok_gizli_guvenlik_anahtari_2024"

# API Keys
npx sst secret set TIINGO_API_KEY "8d7674649237b42f01f6024a01e874fa3b2e9bfb"
npx sst secret set OPENAI_API_KEY "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"
npx sst secret set GEMINI_API_KEY "AIzaSyBDoqpMHAlk8aVTi0R1p9TVm3UOgFt_9lo"
npx sst secret set FINANCIAL_DATASETS_API_KEY "b1bf3b67-13bf-4c37-92f6-00d900bfb246"
npx sst secret set POLYGON_API_KEY "5dhtJnVPIwEVhD0wy0Sjk_epIxnT5h2F"
npx sst secret set GOOGLE_CLIENT_ID "31375613755-tu8dkeo411m0kltv4sa2bc6jbjd7cbep.apps.googleusercontent.com"

# SMTP
npx sst secret set SMTP_HOST "smtp.turkticaret.net"
npx sst secret set SMTP_PORT "587"
npx sst secret set SMTP_EMAIL "destek@finbot.com.tr"
npx sst secret set SMTP_PASSWORD "Efsun*2005"
```

**Verify secrets:**
```bash
npx sst secret list
```

---

## 🔥 Deployment Steps

### Step 1: Deploy to AWS
From project root directory:
```bash
npm run deploy:dev
```

**What will happen:**
- SST will create CloudFormation stacks
- Lambda function will be created (with your Express app)
- S3 bucket + CloudFront distribution for frontend
- IAM roles with Bedrock permissions
- Takes ~5-10 minutes on first deploy

**Expected Output:**
```
✔  Complete
   api: https://xxxxxx.lambda-url.us-east-1.on.aws
   frontend: https://dxxxxx.cloudfront.net
```

### Step 2: Update CLIENT_URL (Important!)
After deployment, copy the CloudFront URL and:

1. Edit `sst.config.js` line 55:
   ```javascript
   CLIENT_URL: "https://dxxxxx.cloudfront.net"
   ```

2. Redeploy:
   ```bash
   npm run deploy:dev
   ```

---

## ✅ Post-Deployment Testing

### Test Backend
```bash
# Replace with your actual Lambda URL
curl https://YOUR_LAMBDA_URL/api/health
```
**Expected:** `{"ok":true,"timestamp":"...","env":"production"}`

### Test Frontend
1. Open CloudFront URL in browser
2. You should see FinBot landing page
3. Register a new account
4. Go to Chat
5. Send: "Apple hakkında bilgi ver"
6. Should receive AI response

### Check Logs
- AWS Console → CloudWatch → Log groups
- Find `/aws/lambda/finbot-global-dev-FinBotApi`
- Look for startup logs and any errors

---

## 🐛 Common Issues

### "Permission Denied" during deployment
- Check AWS credentials: `aws configure list`
- Ensure IAM user has CloudFormation, Lambda, S3, CloudFront permissions

### "Region mismatch" error
- Verify `sst.config.js` line 16 shows `us-east-1`
- Verify AWS CLI: `aws configure get region`

### "Bedrock access denied"
- Ensure you requested model access in AWS Console
- Wait 5 minutes after requesting, then redeploy

### "MongoDB connection timeout"
- Check MongoDB Atlas Network Access
- Add `0.0.0.0/0` to IP whitelist

### Frontend shows 404
- Check if build succeeded (look for `build/` folder in frontend)
- CloudFront can take 5-10 minutes to propagate
- Try invalidating CloudFront cache

---

## 📊 Monitoring After Deployment

- **Lambda Metrics**: CloudWatch → Metrics → Lambda
- **Frontend Access**: CloudFront → Distributions → Monitoring
- **Costs**: AWS Cost Explorer (should be minimal on free tier)

---

## 🎯 Success Criteria

- [ ] Health check returns 200 OK
- [ ] Frontend loads on CloudFront URL
- [ ] User can register/login
- [ ] Chat sends message and AI responds
- [ ] No errors in CloudWatch logs
- [ ] MongoDB documents created successfully

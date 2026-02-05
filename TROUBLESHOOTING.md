# SST Deployment Troubleshooting Guide

## Current Issue: Pulumi Provider Error

**Error**: `exit status 1` from `@pulumi/pulumi/cmd/dynamic-provider-pulumi-nodejs.cmd`

This error indicates SST/Pulumi cannot execute properly, likely due to permissions or environment issues.

---

## Step-by-Step Troubleshooting

### 1. Check AWS IAM Permissions

Your AWS user needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "s3:*",
        "lambda:*",
        "iam:CreateRole",
        "iam:PutRolePolicy",
        "iam:AttachRolePolicy",
        "iam:GetRole",
        "iam:PassRole",
        "iam:DeleteRole",
        "iam:DeleteRolePolicy",
        "iam:DetachRolePolicy",
        "cloudfront:*",
        "ssm:GetParameter",
        "ssm:PutParameter",
        "ssm:DeleteParameter",
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "*"
    }
  ]
}
```

**How to check:**
1. AWS Console → IAM → Users → Your User
2. Check attached policies
3. You need either `AdministratorAccess` OR the permissions above

---

### 2. Run Verbose Deployment

Get more detailed error information:

```bash
npx sst deploy --stage dev --verbose
```

This will show exactly where the deployment fails.

---

### 3. Check Node.js Version

SST v3 requires Node.js 18 or higher. You have Node v24.5.0 ✅

Check if there are any Node.js permission issues:

```bash
node --version
npm --version
```

---

### 4. Clear All Caches

Sometimes npm/Pulumi caches get corrupted:

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
Remove-Item -Path "node_modules" -Recurse -Force
Remove-Item -Path "package-lock.json" -Force
npm install

# Clear SST cache
Remove-Item -Path ".sst" -Recurse -Force
```

---

### 5. Check Windows Permissions

The error mentions "EPERM: operation not permitted". This could be Windows file permissions:

**Option A - Run as Administrator:**
1. Right-click PowerShell
2. "Run as Administrator"
3. Navigate to project directory
4. Try deployment again

**Option B - Disable Antivirus Temporarily:**
Sometimes Windows Defender or antivirus blocks npm operations.

---

### 6. Alternative: Use AWS CDK Directly

If SST continues to fail, you can deploy using AWS CDK instead:

```bash
npm install -g aws-cdk
cdk init app --language javascript
```

Then manually create Lambda and S3/CloudFront resources.

---

### 7. Check SST Bootstrap

SST needs to bootstrap your AWS account once:

```bash
npx sst bootstrap
```

This creates necessary SST resources in your AWS account.

---

### 8. Verify Pul umi Installation

SST uses Pulumi under the hood. Check if Pulumi is working:

```bash
# Check Pulumi version
npx pulumi version

# If it fails, manually install Pulumi
npm install -g @pulumi/pulumi
```

---

### 9. Try Different SST Version

The current version is 3.17.38. Try downgrading:

```json
// package.json
{
  "devDependencies": {
    "sst": "3.15.0"  // Try earlier version
  }
}
```

Then:
```bash
npm install
npm run deploy:dev
```

---

### 10. Manual Lambda Deployment (Fallback)

If SST won't work, deploy manually:

**Backend:**
```bash
cd backend
zip -r function.zip .
aws lambda create-function \
  --function-name finbot-api \
  --runtime nodejs20.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-role \
  --handler lambda.handler \
  --zip-file fileb://function.zip
```

**Frontend:**
```bash
cd frontend
npm run build
aws s3 sync build/ s3://finbot-frontend
aws cloudfront create-distribution ...
```

---

## Recommended Next Steps

1. **First**: Try running as Administrator
2. **Second**: Run `npx sst deploy --stage dev --verbose` and share the full output
3. **Third**: Try `npx sst bootstrap` 
4. **Last Resort**: Manual deployment or switch to AWS CDK

---

## Quick Command Reference

```bash
# Verbose deployment
npx sst deploy --stage dev --verbose

# Bootstrap SST
npx sst bootstrap

# Clear everything and retry
Remove-Item -Path ".sst" -Recurse -Force
Remove-Item -Path "node_modules" -Recurse -Force
npm install
npm run deploy:dev

# Check AWS credentials
aws sts get-caller-identity

# List SST secrets
npx sst secret list --stage dev
```

---

## Get Help

If none of this works:
1. SST Discord: https://sst.dev/discord
2. GitHub Issues: https://github.com/sst/sst/issues
3. Share the verbose deployment output

The SST community is very helpful and can diagnose Pulumi errors quickly.

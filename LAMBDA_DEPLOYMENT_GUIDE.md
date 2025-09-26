# 🚀 HireThemNow .NET Lambda Deployment Guide

This guide will help you deploy your .NET API to AWS Lambda and fix the "second URL not working" issue.

## 📋 Prerequisites

1. **AWS CLI installed and configured**
   ```bash
   aws --version
   aws configure
   ```

2. **.NET 8 SDK**
   ```bash
   dotnet --version  # Should be 8.x or later
   ```

3. **AWS Lambda Tools for .NET** (Already installed ✅)
   ```bash
   dotnet tool install -g Amazon.Lambda.Tools
   ```

## 🛠️ What's Been Configured

### ✅ .NET API Changes Made:
- Added `Amazon.Lambda.AspNetCoreServer.Hosting` package
- Modified `Program.cs` to work with Lambda
- Updated CORS to include API Gateway URL
- Removed static file serving (handled by CloudFront)
- Created Lambda configuration files

### ✅ Files Created:
- `aws-lambda-tools-defaults.json` - Lambda deployment settings
- `serverless.template` - SAM template for Lambda
- `deploy-lambda.ps1` - PowerShell deployment script
- `deploy-lambda.sh` - Bash deployment script
- `deploy-complete.ps1` - Complete infrastructure + Lambda deployment

## 🚀 Deployment Options

### Option 1: Quick Lambda-Only Deployment

If your infrastructure is already deployed, just update the Lambda function:

**Windows (PowerShell):**
```powershell
cd HireThemNoW.Server
.\deploy-lambda.ps1 -Environment prod
```

**Linux/macOS:**
```bash
cd HireThemNoW.Server
./deploy-lambda.sh prod
```

### Option 2: Complete Infrastructure + Lambda Deployment

Deploy everything from scratch:

**Windows (PowerShell):**
```powershell
.\deploy-complete.ps1 -Environment prod
```

This will:
1. Deploy CloudFormation infrastructure
2. Build and deploy .NET API to Lambda
3. Build and deploy React frontend to S3
4. Show deployment summary

### Option 3: Manual Step-by-Step

1. **Deploy Infrastructure:**
   ```bash
   cd aws-deployment
   aws cloudformation deploy \
     --template-file cloudformation-template.yaml \
     --stack-name hirethemnow-prod \
     --parameter-overrides \
       Environment=prod \
       DatabasePassword=hirethem4us \
       JWTSecret=ae9d27decc25cb45671ce98206e402e2 \
       GoogleClientId=419725254966-5i7rgg3h7j984od6mi3ib4tt3rqq8o4j.apps.googleusercontent.com \
       GoogleClientSecret=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 \
     --capabilities CAPABILITY_IAM \
     --region us-east-1
   ```

2. **Deploy Lambda Function:**
   ```bash
   cd HireThemNoW.Server
   dotnet lambda deploy-function \
     --function-name hirethemnow-prod-api-prod \
     --region us-east-1 \
     --configuration Release
   ```

3. **Deploy Frontend:**
   ```bash
   cd hirethemnow.client
   export VITE_API_BASE_URL="https://YOUR_API_GATEWAY_URL"
   npm run build:production
   aws s3 sync dist/ s3://YOUR_FRONTEND_BUCKET --delete
   ```

## 🔧 Fixing the "Second URL Not Working" Issue

The issue was caused by:
1. **API Gateway URL mismatch** - Frontend calling different URL than CORS allowed
2. **Placeholder Lambda function** - Node.js placeholder instead of your .NET API

### The Fix:
1. ✅ **Updated CORS** to include API Gateway URL (`e4ur4ddyoi.execute-api.us-east-1.amazonaws.com`)
2. ✅ **Deployed .NET API** to replace placeholder Lambda function
3. ✅ **Fixed routing** to handle API Gateway proxy integration

## 📊 Verification Steps

After deployment, test these endpoints:

1. **Preflight (OPTIONS) request:**
   ```bash
   curl -X OPTIONS \
     -H "Origin: https://d203avobknjbyh.cloudfront.net" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: content-type" \
     https://e4ur4ddyoi.execute-api.us-east-1.amazonaws.com/prod/auth/google
   ```

2. **Actual API request:**
   ```bash
   curl -X POST \
     -H "Content-Type: application/json" \
     -H "Origin: https://d203avobknjbyh.cloudfront.net" \
     -d '{"token":"test"}' \
     https://e4ur4ddyoi.execute-api.us-east-1.amazonaws.com/prod/auth/google
   ```

3. **Health check:**
   ```bash
   curl https://e4ur4ddyoi.execute-api.us-east-1.amazonaws.com/prod/auth/profile
   ```

## 🐛 Troubleshooting

### Common Issues:

1. **CORS still failing:**
   - Check the Lambda logs in CloudWatch
   - Verify the Origin header matches allowed domains

2. **404 errors:**
   - Ensure API routes start with `/api/` or update your frontend config

3. **500 errors:**
   - Check Lambda function logs
   - Verify environment variables are set correctly

4. **Build failures:**
   - Ensure .NET 8 SDK is installed
   - Check for package restore issues

### Checking Logs:
```bash
# View Lambda logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/hirethemnow"

# Get recent logs
aws logs filter-log-events \
  --log-group-name "/aws/lambda/hirethemnow-prod-api-prod" \
  --start-time $(date -d '10 minutes ago' +%s)000
```

## 🔄 Updating the Lambda Function

To update just the Lambda function after code changes:

```bash
cd HireThemNoW.Server
dotnet clean
dotnet build --configuration Release
dotnet lambda deploy-function --function-name hirethemnow-prod-api-prod
```

## 📈 Performance Considerations

- **Memory**: Set to 512MB (adjust based on usage)
- **Timeout**: 30 seconds (sufficient for API calls)
- **Cold Start**: ~2-3 seconds for first request
- **Warm Requests**: <100ms

## 🎯 Expected Results

After successful deployment:
1. ✅ Preflight requests should return 200 with CORS headers
2. ✅ API requests should return proper JSON responses
3. ✅ Frontend should successfully authenticate with Google
4. ✅ All API endpoints should work correctly

## 🔗 Useful URLs

- **CloudFormation Console**: https://console.aws.amazon.com/cloudformation/
- **Lambda Console**: https://console.aws.amazon.com/lambda/
- **API Gateway Console**: https://console.aws.amazon.com/apigateway/
- **CloudWatch Logs**: https://console.aws.amazon.com/cloudwatch/home#logs:

---

**🎉 Your .NET API should now be working correctly on AWS Lambda!**
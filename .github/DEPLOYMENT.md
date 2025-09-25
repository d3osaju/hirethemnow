# GitHub Actions Deployment Guide

This project uses GitHub Actions for automated CI/CD deployment to AWS.

## 🔄 Deployment Workflow

### Automatic Deployment
- **Trigger**: Push to `main` branch
- **Target**: AWS Production Environment
- **Process**: Build → Test → Deploy → Invalidate Cache

### Manual Deployment
- Go to **Actions** tab in GitHub
- Select **Deploy to AWS Production** workflow
- Click **Run workflow** → **Run workflow**

## ⚙️ Required GitHub Secrets

Configure these secrets in your GitHub repository:

### AWS Credentials
```
AWS_ACCESS_KEY_ID       = your-aws-access-key
AWS_SECRET_ACCESS_KEY   = your-aws-secret-key
```

### Application Secrets
```
DATABASE_PASSWORD       = hirethem4us
```

## 🔐 Setting Up GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret from the list above

### AWS IAM User Permissions
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
                "apigateway:*",
                "rds:*",
                "ec2:*",
                "iam:*",
                "cloudfront:*",
                "logs:*"
            ],
            "Resource": "*"
        }
    ]
}
```

## 🚀 Deployment Process

### 1. CI Pipeline (`ci.yml`)
**Triggers**: Push to `main`/`develop`, Pull Requests

**Jobs**:
- ✅ **Frontend Tests**: Lint, TypeScript check, build
- ✅ **Backend Tests**: Build, test (when available)
- ✅ **Security Scan**: Vulnerability scanning with Trivy
- ✅ **Infrastructure**: CloudFormation template validation

### 2. Production Deploy (`deploy-production.yml`)
**Triggers**: Push to `main`, Manual dispatch

**Steps**:
1. **Setup**: Node.js 18, .NET 8, AWS credentials
2. **Quality**: Lint + TypeScript checks
3. **Infrastructure**: Deploy CloudFormation stack
4. **Frontend**: Build React app → Deploy to S3
5. **Backend**: Build .NET app → Package for Lambda
6. **Cache**: Invalidate CloudFront distribution
7. **Notify**: Post deployment URLs

## 📋 Deployment Checklist

### First Time Setup:
- [ ] Configure GitHub secrets (AWS credentials, database password)
- [ ] Verify AWS permissions for IAM user
- [ ] Review CloudFormation template parameters
- [ ] Test deployment with manual trigger

### Regular Deployments:
- [ ] Create feature branch from `main`
- [ ] Make changes and commit
- [ ] Open Pull Request (triggers CI)
- [ ] Review CI results
- [ ] Merge to `main` (triggers production deploy)
- [ ] Verify deployment success

## 🔍 Monitoring Deployments

### GitHub Actions
- **Actions Tab**: View workflow runs and logs
- **Pull Requests**: See CI status and comments
- **Deployments**: Track deployment history

### AWS Console
- **CloudFormation**: Monitor stack updates
- **S3**: Verify frontend files uploaded
- **CloudFront**: Check distribution status
- **Lambda**: Monitor function deployment
- **CloudWatch**: View application logs

## 🚨 Troubleshooting

### Common Issues

1. **AWS Credentials Error**
   ```
   Error: The security token included in the request is invalid
   ```
   - Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in GitHub secrets
   - Check AWS user permissions

2. **CloudFormation Stack Error**
   ```
   Error: Stack update failed
   ```
   - Check CloudFormation events in AWS Console
   - Verify template syntax with `aws cloudformation validate-template`

3. **Frontend Build Error**
   ```
   Error: npm run build:production failed
   ```
   - Check TypeScript errors in logs
   - Verify all dependencies are in `package.json`

4. **S3 Upload Error**
   ```
   Error: Access Denied
   ```
   - Verify S3 bucket permissions in CloudFormation
   - Check AWS user has S3 write permissions

### Emergency Rollback
1. Go to **AWS CloudFormation Console**
2. Select your stack (`hirethemnow-prod`)
3. **Actions** → **Update stack** → **Use previous template**
4. Review and confirm rollback

## 📊 Deployment Artifacts

### Built Assets:
- **Frontend**: `hirethemnow.client/dist/` → S3 bucket
- **Backend**: `HireThemNoW.Server/publish/` → Lambda deployment package

### Generated Files:
- `.env.production` - Frontend environment variables
- `lambda-deployment.zip` - Backend deployment package

## 🔗 Deployment URLs

After successful deployment, check the workflow logs for:
- **Frontend URL**: CloudFront distribution URL
- **API URL**: API Gateway endpoint
- **Stack Name**: `hirethemnow-prod`

## 📝 Workflow Customization

### Environment Variables
Edit `.github/workflows/deploy-production.yml`:
```yaml
env:
  AWS_REGION: us-east-1        # Change AWS region
  STACK_NAME: hirethemnow-prod # Change stack name
  NODE_VERSION: '18'           # Change Node.js version
  DOTNET_VERSION: '8.0.x'      # Change .NET version
```

### Deployment Branches
Change deployment trigger:
```yaml
on:
  push:
    branches: [ main ]  # Change to your deployment branch
```

### Slack/Discord Notifications
Add notification step:
```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

**Quick Start**: Push to `main` branch and watch the magic happen! 🪄
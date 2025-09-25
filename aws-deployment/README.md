# HireThemNow AWS Deployment Guide

This guide provides a cost-effective AWS deployment strategy for the HireThemNow application.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │────│   S3 Bucket      │    │   API Gateway   │
│  (CDN + HTTPS)  │    │  (React App)     │    │  (REST API)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                ┌─────────────────┐
                                                │  Lambda Function │
                                                │  (.NET 8 API)   │
                                                └─────────────────┘
                                                         │
                                                ┌─────────────────┐
                                                │  RDS PostgreSQL │
                                                │  (t3.micro)     │
                                                └─────────────────┘
```

## 💰 Cost Breakdown (Monthly Estimates)

| Service | Configuration | Cost |
|---------|---------------|------|
| S3 + CloudFront | Static hosting | $1-5 |
| Lambda + API Gateway | Serverless API | $0-20 |
| RDS PostgreSQL | t3.micro | $15-25 |
| **Total** | | **$20-50/month** |

## 🚀 Deployment Options

### Option 1: PowerShell (Windows)
```powershell
# Navigate to deployment folder
cd aws-deployment

# Deploy to development
.\deploy.ps1 -Environment dev

# Deploy to production
.\deploy.ps1 -Environment prod -StackName hirethemnow-prod
```

### Option 2: Bash (Linux/macOS)
```bash
# Make script executable
chmod +x deploy.sh

# Deploy to development
./deploy.sh --environment dev

# Deploy to production
./deploy.sh --environment prod --stack-name hirethemnow-prod
```

### Option 3: Manual CloudFormation
```bash
# Deploy infrastructure
aws cloudformation deploy \
  --template-file cloudformation-template.yaml \
  --stack-name hirethemnow-dev \
  --parameter-overrides Environment=dev \
  --capabilities CAPABILITY_IAM

# Build and deploy frontend
cd ../hirethemnow.client
npm run build
aws s3 sync dist/ s3://hirethemnow-dev-frontend --delete
```

## 🔧 Prerequisites

1. **AWS CLI installed and configured**
   ```bash
   aws --version
   aws configure
   ```

2. **Node.js and npm** (for frontend)
   ```bash
   node --version
   npm --version
   ```

3. **.NET 8 SDK** (for backend)
   ```bash
   dotnet --version
   ```

4. **PowerShell** (Windows) or **jq** (Linux/macOS)
   ```bash
   # Linux/macOS
   sudo apt install jq  # Ubuntu/Debian
   brew install jq      # macOS
   ```

## 📋 Environment Variables

The deployment will set up these environment variables automatically:

| Variable | Description | Source |
|----------|-------------|---------|
| `VITE_API_URL` | Frontend API endpoint | CloudFormation output |
| `DATABASE_URL` | PostgreSQL connection | RDS endpoint |
| `JWT_SECRET` | Authentication secret | Parameter |
| `GOOGLE_CLIENT_ID` | OAuth client ID | Parameter |

## 🔐 Security Features

- **HTTPS Everywhere**: CloudFront enforces HTTPS
- **VPC Isolation**: Database in private subnets
- **IAM Roles**: Least privilege access
- **Security Groups**: Network-level firewalls
- **Encrypted Storage**: RDS and S3 encryption

## 📊 Monitoring & Costs

### Cost Optimization Tips:
1. **Use RDS t3.micro** for development
2. **Aurora Serverless v2** for production scaling
3. **CloudFront caching** reduces API calls
4. **S3 Intelligent Tiering** for file storage

### Monitoring:
```bash
# Check stack status
aws cloudformation describe-stacks --stack-name hirethemnow-dev

# View Lambda logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/hirethemnow"

# CloudWatch metrics
aws cloudwatch get-metric-statistics --namespace AWS/Lambda
```

## 🚨 Troubleshooting

### Common Issues:

1. **Stack deployment fails**
   ```bash
   # Check events
   aws cloudformation describe-stack-events --stack-name hirethemnow-dev
   ```

2. **Frontend build fails**
   ```bash
   cd hirethemnow.client
   npm install
   npm run build
   ```

3. **API not responding**
   - Check Lambda function logs in CloudWatch
   - Verify security group rules
   - Confirm database connectivity

### Rollback Process:
```bash
# Delete stack (careful!)
aws cloudformation delete-stack --stack-name hirethemnow-dev

# Or update to previous version
aws cloudformation update-stack --stack-name hirethemnow-dev --use-previous-template
```

## 🔄 CI/CD Integration

### GitHub Actions Example:
```yaml
name: Deploy to AWS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Configure AWS
        run: |
          aws configure set aws_access_key_id ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws configure set aws_secret_access_key ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      - name: Deploy
        run: |
          cd aws-deployment
          ./deploy.sh --environment prod
```

## 📈 Scaling Considerations

### For High Traffic:
1. **API Gateway**: Automatically scales
2. **Lambda**: Concurrent executions (1000 default)
3. **RDS**: Upgrade to larger instances or Aurora
4. **CloudFront**: Global edge locations

### Database Scaling:
```sql
-- Monitor database performance
SELECT * FROM pg_stat_activity;
SELECT * FROM pg_stat_database;
```

## 🛠️ Maintenance

### Regular Tasks:
1. **Database backups**: RDS automated backups (7 days)
2. **Security updates**: Lambda runtime updates
3. **Cost monitoring**: AWS Cost Explorer
4. **Performance monitoring**: CloudWatch dashboards

### Backup Strategy:
- **RDS**: Automated backups + manual snapshots
- **S3**: Cross-region replication for critical files
- **Code**: Git repository + tagged releases

## 📞 Support

For deployment issues:
1. Check AWS CloudFormation events
2. Review Lambda CloudWatch logs
3. Verify IAM permissions
4. Confirm network connectivity

---

**Total setup time**: ~30 minutes
**Estimated monthly cost**: $20-50 (low-medium traffic)
**Scaling**: Automatic (serverless architecture)
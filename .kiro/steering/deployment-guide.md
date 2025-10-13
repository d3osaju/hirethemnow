# Deployment Guide

## Overview

This guide covers deployment procedures, environment setup, and common workflows for the HireThemNow application.

## Prerequisites

### Required Tools

- **.NET 8 SDK**: [Download](https://dotnet.microsoft.com/download/dotnet/8.0)
- **Node.js 18+**: [Download](https://nodejs.org/)
- **AWS CLI**: [Download](https://aws.amazon.com/cli/)
- **PowerShell**: For deployment scripts
- **Git**: For version control

### AWS Account Setup

1. Create AWS account
2. Create IAM user with programmatic access
3. Attach required policies (see IAM section)
4. Configure AWS CLI:

```powershell
aws configure
# Enter Access Key ID
# Enter Secret Access Key
# Enter region: us-east-1
# Enter output format: json
```

### Environment Variables

Create `.env.deploy` file (never commit this):

```env
# AWS Credentials
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# Application Secrets
JWT_SECRET=your-random-32-character-secret-key
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_PASSWORD=your-secure-database-password

# AWS Services
AWS__S3__BucketName=hirethemnow-files
```

---

## Local Development

### Backend Setup

```powershell
# Navigate to server project
cd HireThemNoW.Server

# Restore dependencies
dotnet restore

# Run database migrations
dotnet ef database update

# Run application
dotnet run

# Application runs at http://localhost:5219
```

### Frontend Setup

```powershell
# Navigate to client project
cd hirethemnow.client

# Install dependencies
npm install

# Run development server
npm run dev

# Application runs at http://localhost:5173
```

### Local Database

For local development, use PostgreSQL:

```powershell
# Install PostgreSQL (Windows)
choco install postgresql

# Create database
psql -U postgres
CREATE DATABASE hirethemnow_dev;
\q

# Update appsettings.Development.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=hirethemnow_dev;Username=postgres;Password=postgres;"
  }
}
```

---

## Backend Deployment

### Automated Deployment

Use the `deploy-backend.ps1` script:

```powershell
# Deploy to production
.\deploy-backend.ps1

# Script will:
# 1. Build .NET application
# 2. Create IIS deployment package
# 3. Deploy to Elastic Beanstalk
# 4. Configure database connection
# 5. Set up HTTPS (if prompted)
```

### Manual Deployment

```powershell
# 1. Build application
cd HireThemNoW.Server
dotnet publish -c Release -o ./publish

# 2. Create deployment package
Compress-Archive -Path ./publish/* -DestinationPath deployment.zip

# 3. Deploy to Elastic Beanstalk
eb deploy hirethemnow-prod --region us-east-1

# 4. Verify deployment
aws elasticbeanstalk describe-environments --environment-names hirethemnow-prod --region us-east-1
```

### Environment Configuration

Set environment variables via AWS CLI:

```powershell
aws elasticbeanstalk update-environment `
  --environment-name hirethemnow-prod `
  --region us-east-1 `
  --option-settings `
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DATABASE_HOST,Value=your-db-host `
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DATABASE_NAME,Value=postgres `
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DATABASE_USER,Value=postgres `
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DATABASE_PASSWORD,Value=your-password `
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=JWT_SECRET,Value=your-secret `
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=GOOGLE_CLIENT_ID,Value=your-client-id `
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=GOOGLE_CLIENT_SECRET,Value=your-client-secret
```

### Database Migrations

Migrations run automatically on application startup. To run manually:

```powershell
# Create migration
dotnet ef migrations add MigrationName --project HireThemNoW.Server

# Apply migration locally
dotnet ef database update --project HireThemNoW.Server

# For production, migrations run on app startup via Program.cs:
# context.Database.Migrate();
```

---

## Frontend Deployment

### Automated Deployment

Use the `deploy-frontend.ps1` script:

```powershell
# Deploy to production
.\deploy-frontend.ps1

# Script will:
# 1. Build React application
# 2. Upload to S3 bucket
# 3. Configure static hosting
# 4. Invalidate CloudFront cache
```

### Manual Deployment

```powershell
# 1. Build application
cd hirethemnow.client
npm run build

# 2. Upload to S3
aws s3 sync ./dist s3://hirethemnow-frontend --delete

# 3. Invalidate CloudFront cache
aws cloudfront create-invalidation `
  --distribution-id YOUR_DISTRIBUTION_ID `
  --paths "/*"
```

### Environment Configuration

Update `.env.production`:

```env
VITE_API_URL=https://api.hirethemnow.xyz
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

## Database Setup

### Create RDS Instance

```powershell
# Create PostgreSQL instance
aws rds create-db-instance `
  --db-instance-identifier hirethemnow-db `
  --db-instance-class db.t3.micro `
  --engine postgres `
  --engine-version 17.4 `
  --master-username postgres `
  --master-user-password YOUR_PASSWORD `
  --allocated-storage 20 `
  --region us-east-1 `
  --backup-retention-period 7 `
  --no-multi-az `
  --publicly-accessible

# Wait for instance to be available (5-10 minutes)
aws rds wait db-instance-available --db-instance-identifier hirethemnow-db --region us-east-1

# Get endpoint
aws rds describe-db-instances `
  --db-instance-identifier hirethemnow-db `
  --region us-east-1 `
  --query "DBInstances[0].Endpoint.Address" `
  --output text
```

### Configure Security Groups

```powershell
# Get RDS security group
$RDS_SG = aws rds describe-db-instances `
  --db-instance-identifier hirethemnow-db `
  --region us-east-1 `
  --query "DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId" `
  --output text

# Get Elastic Beanstalk security group
$EB_SG = aws ec2 describe-security-groups `
  --region us-east-1 `
  --filters "Name=group-name,Values=awseb-e-*" `
  --query "SecurityGroups[0].GroupId" `
  --output text

# Allow EB to access RDS
aws ec2 authorize-security-group-ingress `
  --group-id $RDS_SG `
  --protocol tcp `
  --port 5432 `
  --source-group $EB_SG `
  --region us-east-1
```

---

## SSL Certificate Setup

### Request Certificate

```powershell
# Request certificate
aws acm request-certificate `
  --domain-name hirethemnow.xyz `
  --subject-alternative-names "*.hirethemnow.xyz" "api.hirethemnow.xyz" "www.hirethemnow.xyz" `
  --validation-method DNS `
  --region us-east-1

# Get certificate ARN
$CERT_ARN = aws acm list-certificates `
  --region us-east-1 `
  --query "CertificateSummaryList[?DomainName=='hirethemnow.xyz'].CertificateArn" `
  --output text

# Get validation records
aws acm describe-certificate `
  --certificate-arn $CERT_ARN `
  --region us-east-1 `
  --query "Certificate.DomainValidationOptions"
```

### Add DNS Records

Add CNAME records at your domain registrar:

```
Type: CNAME
Name: _abc123.hirethemnow.xyz
Value: _xyz789.acm-validations.aws.
TTL: 300
```

Wait 5-30 minutes for validation.

### Configure HTTPS

```powershell
# Configure HTTPS listener on Elastic Beanstalk
aws elasticbeanstalk update-environment `
  --environment-name hirethemnow-prod `
  --region us-east-1 `
  --option-settings `
    Namespace=aws:elb:listener:443,OptionName=ListenerProtocol,Value=HTTPS `
    Namespace=aws:elb:listener:443,OptionName=InstancePort,Value=80 `
    Namespace=aws:elb:listener:443,OptionName=InstanceProtocol,Value=HTTP `
    Namespace=aws:elb:listener:443,OptionName=SSLCertificateId,Value=$CERT_ARN
```

---

## Custom Domain Setup

### DNS Configuration

Add these records at your domain registrar:

**For API (Elastic Beanstalk)**:
```
Type: CNAME
Name: api
Value: awseb-e-x-awsebloa-x91qpl92x8fi-1030568985.us-east-1.elb.amazonaws.com
TTL: 3600
```

**For Frontend (CloudFront)**:
```
Type: CNAME
Name: www
Value: d203avobknjbyh.cloudfront.net
TTL: 3600

Type: A (Alias)
Name: @
Value: CloudFront distribution
TTL: 3600
```

### Verify DNS

```powershell
# Check DNS propagation
nslookup api.hirethemnow.xyz
nslookup www.hirethemnow.xyz
nslookup hirethemnow.xyz

# Test endpoints
curl https://api.hirethemnow.xyz/api/health/aws-services
curl https://hirethemnow.xyz
```

---

## Monitoring and Logging

### CloudWatch Logs

```powershell
# View recent logs
aws logs tail /aws/elasticbeanstalk/hirethemnow-prod/var/log/web.stdout.log --follow

# Search for errors
aws logs filter-log-events `
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod `
  --filter-pattern "ERROR" `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# Search for analysis-specific logs
aws logs filter-log-events `
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod `
  --filter-pattern "ATS analysis" `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# Search for background service logs
aws logs filter-log-events `
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod `
  --filter-pattern "ResumeParsingBackgroundService" `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
```

### Application Logs

```powershell
# Request logs from Elastic Beanstalk
aws elasticbeanstalk request-environment-info `
  --environment-name hirethemnow-prod `
  --info-type tail `
  --region us-east-1

# Wait 10 seconds
Start-Sleep -Seconds 10

# Retrieve logs
aws elasticbeanstalk retrieve-environment-info `
  --environment-name hirethemnow-prod `
  --info-type tail `
  --region us-east-1
```

### Health Checks

```powershell
# Check environment health
aws elasticbeanstalk describe-environment-health `
  --environment-name hirethemnow-prod `
  --attribute-names All `
  --region us-east-1

# Check recent events
aws elasticbeanstalk describe-events `
  --environment-name hirethemnow-prod `
  --region us-east-1 `
  --max-items 20
```

---

## Rollback Procedures

### Backend Rollback

```powershell
# List application versions
aws elasticbeanstalk describe-application-versions `
  --application-name hirethemnow `
  --region us-east-1

# Deploy previous version
aws elasticbeanstalk update-environment `
  --environment-name hirethemnow-prod `
  --version-label previous-version-label `
  --region us-east-1
```

### Frontend Rollback

```powershell
# Restore from Git
git checkout previous-commit-hash
npm run build
aws s3 sync ./dist s3://hirethemnow-frontend --delete

# Invalidate CloudFront
aws cloudfront create-invalidation `
  --distribution-id YOUR_DISTRIBUTION_ID `
  --paths "/*"
```

### Database Rollback

```powershell
# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot `
  --db-instance-identifier hirethemnow-db-restored `
  --db-snapshot-identifier snapshot-name `
  --region us-east-1

# Update connection string to new instance
```

---

## Troubleshooting

### Backend Issues

**Issue**: Application won't start
```powershell
# Check logs
aws elasticbeanstalk describe-events --environment-name hirethemnow-prod --region us-east-1

# Check environment variables
aws elasticbeanstalk describe-configuration-settings --environment-name hirethemnow-prod --region us-east-1

# Restart application
aws elasticbeanstalk restart-app-server --environment-name hirethemnow-prod --region us-east-1
```

**Issue**: Database connection fails
```powershell
# Verify security group rules
aws ec2 describe-security-groups --group-ids $RDS_SG --region us-east-1

# Test connection from EB instance
# SSH into instance and run:
psql -h $DB_HOST -U postgres -d postgres
```

### Frontend Issues

**Issue**: 404 errors on refresh
```powershell
# Ensure CloudFront error pages configured
aws cloudfront get-distribution-config --id YOUR_DISTRIBUTION_ID

# Should have error page: 404 -> /index.html
```

**Issue**: Old content showing
```powershell
# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

# Clear browser cache
# Hard refresh: Ctrl+Shift+R
```

---

## CI/CD Pipeline (Future)

### GitHub Actions Example

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v1
        with:
          dotnet-version: 8.0.x
      
      - name: Build
        run: dotnet publish -c Release -o ./publish
      
      - name: Deploy to EB
        uses: einaregilsson/beanstalk-deploy@v21
        with:
          aws_access_key: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws_secret_key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          application_name: hirethemnow
          environment_name: hirethemnow-prod
          version_label: ${{ github.sha }}
          region: us-east-1
          deployment_package: deployment.zip
```

---

## Backup and Disaster Recovery

### Automated Backups

- **RDS**: Daily automated backups (7-day retention)
- **S3**: Versioning enabled (optional)
- **Code**: Git repository

### Manual Backup

```powershell
# Create RDS snapshot
aws rds create-db-snapshot `
  --db-instance-identifier hirethemnow-db `
  --db-snapshot-identifier hirethemnow-backup-$(Get-Date -Format "yyyyMMdd-HHmmss") `
  --region us-east-1

# Export S3 bucket
aws s3 sync s3://hirethemnow-files ./backup/s3-files

# Backup database to file
pg_dump -h $DB_HOST -U postgres -d postgres > backup.sql
```

### Disaster Recovery

1. **Database Failure**:
   - Restore from latest RDS snapshot
   - Update connection string
   - Verify data integrity

2. **Application Failure**:
   - Redeploy from Git
   - Restore environment variables
   - Run health checks

3. **Complete Failure**:
   - Create new RDS instance from snapshot
   - Create new EB environment
   - Deploy application
   - Update DNS records

---

## Performance Optimization

### Backend

- Enable response compression
- Use caching for frequently accessed data
- Optimize database queries
- Use async/await for I/O operations
- Implement pagination

### Frontend

- Enable CloudFront compression
- Optimize images (WebP format)
- Lazy load components
- Minimize bundle size
- Use React.memo for expensive components

### Database

- Add indexes on frequently queried columns
- Use connection pooling
- Optimize slow queries
- Regular VACUUM and ANALYZE

---

## Security Checklist

- [ ] HTTPS enabled on all endpoints
- [ ] JWT secret is strong and secure
- [ ] Database password is strong
- [ ] AWS credentials are not committed to Git
- [ ] CORS configured for specific origins
- [ ] S3 buckets are private (except frontend)
- [ ] RDS security group restricts access
- [ ] IAM policies follow least privilege
- [ ] Secrets stored in environment variables
- [ ] Regular security updates applied

---

## Cost Monitoring

### Set Up Billing Alerts

```powershell
# Create billing alarm
aws cloudwatch put-metric-alarm `
  --alarm-name hirethemnow-billing-alert `
  --alarm-description "Alert when monthly costs exceed $100" `
  --metric-name EstimatedCharges `
  --namespace AWS/Billing `
  --statistic Maximum `
  --period 21600 `
  --evaluation-periods 1 `
  --threshold 100 `
  --comparison-operator GreaterThanThreshold `
  --region us-east-1
```

### Monitor Costs

- Check AWS Cost Explorer daily
- Review service usage monthly
- Optimize unused resources
- Use free tier when possible
- Consider reserved instances for production

---

## Maintenance Schedule

### Daily
- Monitor application health
- Check error logs
- Review CloudWatch metrics

### Weekly
- Review database performance
- Check backup status
- Update dependencies (if needed)

### Monthly
- Review AWS costs
- Update security patches
- Review and optimize queries
- Clean up old S3 files

### Quarterly
- Review and update documentation
- Conduct security audit
- Review and optimize infrastructure
- Update SSL certificates (if needed)

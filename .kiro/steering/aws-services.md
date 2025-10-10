# AWS Services Documentation

## Overview

HireThemNow uses multiple AWS services for hosting, storage, AI processing, and notifications. All services are deployed in the `us-east-1` region.

## AWS Services Used

1. **Elastic Beanstalk** - Backend hosting
2. **S3** - File storage
3. **RDS** - PostgreSQL database
4. **Bedrock** - AI resume parsing
5. **SES** - Email notifications
6. **CloudFront** - CDN for frontend
7. **ACM** - SSL certificates
8. **IAM** - Access management

## Elastic Beanstalk

### Configuration

- **Environment Name**: `hirethemnow-prod`
- **Platform**: Windows Server 2022 with IIS 10.0
- **Instance Type**: t3.micro (free tier) or t3.small (production)
- **Runtime**: .NET 8
- **Load Balancer**: Classic ELB
- **Auto Scaling**: Single instance (can be scaled)

### Environment Variables

Set via Elastic Beanstalk console or CLI:

```bash
DATABASE_HOST=hirethemnow-db.abc123.us-east-1.rds.amazonaws.com
DATABASE_NAME=postgres
DATABASE_USER=postgres
DATABASE_PASSWORD=SecurePassword123
JWT_SECRET=your-32-char-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
AWS__S3__BucketName=hirethemnow-files
```

### Deployment

Automated via `deploy-backend.ps1`:

```powershell
# Build and deploy
.\deploy-backend.ps1

# Manual deployment
eb deploy hirethemnow-prod --region us-east-1
```

### Health Checks

- **URL**: `/api/health/aws-services`
- **Interval**: 30 seconds
- **Timeout**: 5 seconds
- **Healthy threshold**: 2
- **Unhealthy threshold**: 5

### Logs

Access logs via:
```bash
# Request logs
aws elasticbeanstalk request-environment-info --environment-name hirethemnow-prod --info-type tail --region us-east-1

# Retrieve logs
aws elasticbeanstalk retrieve-environment-info --environment-name hirethemnow-prod --info-type tail --region us-east-1
```

Or via CloudWatch Logs:
- Log Group: `/aws/elasticbeanstalk/hirethemnow-prod`

---

## S3 (Simple Storage Service)

### Buckets

**hirethemnow-files**
- **Purpose**: Resume and profile picture storage
- **Region**: us-east-1
- **Access**: Private (pre-signed URLs)
- **Versioning**: Disabled
- **Lifecycle**: No automatic deletion

**hirethemnow-frontend**
- **Purpose**: Frontend static hosting
- **Region**: us-east-1
- **Access**: Public read
- **Static hosting**: Enabled
- **Index document**: index.html

### Folder Structure (hirethemnow-files)

```
hirethemnow-files/
├── resumes/
│   └── {userId}_{guid}.pdf
└── profile-pictures/
    └── {userId}_{guid}.{ext}
```

### S3Service Implementation

```csharp
public interface IS3Service
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, string? prefix = null);
    Task<Stream> DownloadFileAsync(string key);
    Task<bool> DeleteFileAsync(string key);
    Task<string> GetPreSignedUrlAsync(string key, int expirationMinutes = 60);
}
```

### Pre-Signed URLs

- **Expiration**: 7 days (10080 minutes) for profile pictures
- **Expiration**: 1 hour (60 minutes) for temporary access
- **Purpose**: Secure file access without public bucket

### Permissions Required

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::hirethemnow-files/*",
        "arn:aws:s3:::hirethemnow-files"
      ]
    }
  ]
}
```

---

## RDS (Relational Database Service)

### Configuration

- **Instance ID**: `hirethemnow-db`
- **Engine**: PostgreSQL 17.4
- **Instance Class**: db.t3.micro (free tier) or db.t3.small (production)
- **Storage**: 20 GB SSD
- **Multi-AZ**: No (single instance)
- **Backup**: Automated daily backups (7-day retention)
- **Encryption**: At rest and in transit

### Connection

```
Host: hirethemnow-db.abc123.us-east-1.rds.amazonaws.com
Port: 5432
Database: postgres
Username: postgres
Password: {from environment variable}
```

### Security Groups

- **Inbound Rule**: PostgreSQL (5432) from Elastic Beanstalk security group
- **Outbound Rule**: All traffic

### Backup Strategy

- **Automated backups**: Daily at 3 AM UTC
- **Retention**: 7 days
- **Manual snapshots**: Before major migrations
- **Point-in-time recovery**: Enabled

### Monitoring

- **CloudWatch Metrics**: CPU, memory, connections, IOPS
- **Enhanced Monitoring**: Enabled (60-second granularity)
- **Alarms**: Set for high CPU, low storage

---

## Bedrock (AI Service)

### Model

- **Model ID**: `amazon.nova-pro-v1:0`
- **Provider**: Amazon
- **Type**: Large Language Model
- **Purpose**: Resume text structuring
- **Region**: us-east-1

### Configuration

```json
{
  "ResumeParsing": {
    "BedrockModelId": "amazon.nova-pro-v1:0",
    "ParsingTimeoutSeconds": 30
  }
}
```

### API Usage

```csharp
var requestBody = new
{
    messages = new[]
    {
        new
        {
            role = "user",
            content = new[] { new { text = prompt } }
        }
    },
    inferenceConfig = new
    {
        maxTokens = 4096,
        temperature = 0.0,
        topP = 0.9
    }
};

var response = await _bedrockClient.InvokeModelAsync(new InvokeModelRequest
{
    ModelId = "amazon.nova-pro-v1:0",
    Body = requestBodyStream,
    ContentType = "application/json"
});
```

### Permissions Required

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0"
      ]
    }
  ]
}
```

### Cost Optimization

- **On-demand pricing**: Pay per token
- **Batch processing**: Process multiple resumes efficiently
- **Caching**: Consider caching common patterns
- **Timeout**: 30 seconds to prevent long-running requests

### Monitoring

- **CloudWatch Logs**: All Bedrock API calls logged
- **Metrics**: Invocation count, latency, errors
- **Alarms**: Set for high error rate or latency

---

## SES (Simple Email Service)

### Configuration

- **Region**: us-east-1
- **Verified Sender**: noreply@hirethemnow.xyz
- **Sandbox Mode**: No (production verified)
- **Daily Sending Quota**: 50,000 emails
- **Max Send Rate**: 14 emails/second

### Email Types

1. **Resume Analysis Complete**
   - Subject: "Your Resume Analysis is Ready!"
   - Template: HTML with ATS score
   - Trigger: After successful parsing

2. **Welcome Email**
   - Subject: "Welcome to HireThemNow!"
   - Template: HTML with onboarding steps
   - Trigger: After registration

3. **Trial Ending**
   - Subject: "Your Trial is Ending Soon"
   - Template: HTML with subscription CTA
   - Trigger: 1 day before trial end

### EmailService Implementation

```csharp
public interface IEmailService
{
    Task SendResumeAnalysisCompleteEmailAsync(string toEmail, string userName, int atsScore);
    Task SendWelcomeEmailAsync(string toEmail, string userName);
    Task SendTrialEndingEmailAsync(string toEmail, string userName, DateTime trialEndDate);
}
```

### Permissions Required

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    }
  ]
}
```

### Monitoring

- **Bounce Rate**: Monitor and remove bounced emails
- **Complaint Rate**: Keep below 0.1%
- **Delivery Rate**: Target 95%+
- **CloudWatch Metrics**: Sends, bounces, complaints

---

## CloudFront (CDN)

### Distribution

- **Distribution ID**: `d203avobknjbyh` (or similar)
- **Origin**: S3 bucket (hirethemnow-frontend)
- **Domain**: hirethemnow.xyz, www.hirethemnow.xyz
- **SSL Certificate**: ACM certificate
- **Price Class**: Use all edge locations

### Configuration

- **Default Root Object**: index.html
- **Error Pages**: 404 → /index.html (SPA routing)
- **Caching**: Default CloudFront caching
- **Compression**: Enabled (gzip, brotli)
- **HTTP to HTTPS**: Redirect

### Cache Invalidation

Automated in `deploy-frontend.ps1`:

```powershell
aws cloudfront create-invalidation `
  --distribution-id $DISTRIBUTION_ID `
  --paths "/*"
```

### Custom Domain

- **CNAME**: www.hirethemnow.xyz → CloudFront distribution
- **Alternate Domain Names**: hirethemnow.xyz, www.hirethemnow.xyz
- **SSL**: ACM certificate (*.hirethemnow.xyz)

---

## ACM (Certificate Manager)

### Certificate

- **Domain**: hirethemnow.xyz
- **SANs**: *.hirethemnow.xyz, api.hirethemnow.xyz, www.hirethemnow.xyz
- **Validation**: DNS (CNAME records)
- **Renewal**: Automatic
- **Region**: us-east-1

### DNS Validation Records

Add CNAME records at domain registrar:

```
Name: _abc123.hirethemnow.xyz
Value: _xyz789.acm-validations.aws.
```

### Usage

- **CloudFront**: Frontend HTTPS
- **Elastic Beanstalk**: Backend API HTTPS
- **Expiration**: Auto-renewed by AWS

---

## IAM (Identity and Access Management)

### User

- **Name**: hirethemnow-deploy
- **Access Type**: Programmatic (access key)
- **MFA**: Recommended for production

### Policies

**HireThemNowFullAccess** (custom policy):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "elasticbeanstalk:*",
        "s3:*",
        "rds:*",
        "bedrock:InvokeModel",
        "ses:SendEmail",
        "ses:SendRawEmail",
        "cloudfront:CreateInvalidation",
        "cloudfront:GetDistribution",
        "acm:ListCertificates",
        "acm:DescribeCertificate",
        "ec2:DescribeSecurityGroups",
        "ec2:AuthorizeSecurityGroupIngress",
        "iam:PassRole"
      ],
      "Resource": "*"
    }
  ]
}
```

### Best Practices

1. **Least Privilege**: Only grant necessary permissions
2. **Rotate Keys**: Rotate access keys every 90 days
3. **Use Roles**: Use IAM roles for EC2 instances
4. **Enable MFA**: For console access
5. **Monitor Access**: CloudTrail for audit logs

---

## Cost Optimization

### Monthly Cost Estimates

**Development** (~$25/month):
- Elastic Beanstalk (t3.micro): $8
- RDS (db.t3.micro): $15
- S3 + CloudFront: $2

**Production** (~$62/month):
- Elastic Beanstalk (t3.small): $17
- RDS (db.t3.small): $30
- S3 + CloudFront: $15

### Cost Reduction Tips

1. **Use Free Tier**: First 12 months
2. **Reserved Instances**: 1-year commitment for 30% savings
3. **S3 Lifecycle**: Delete old files after 90 days
4. **CloudFront**: Use regional edge locations only
5. **RDS**: Use db.t3.micro for development
6. **Bedrock**: Optimize prompts to reduce tokens

---

## Monitoring and Alerts

### CloudWatch Alarms

Set up alarms for:

1. **Elastic Beanstalk**
   - High CPU (>80%)
   - Health check failures
   - 5xx errors (>10/min)

2. **RDS**
   - High CPU (>80%)
   - Low storage (<2GB)
   - High connections (>80% max)

3. **S3**
   - High request rate
   - 4xx/5xx errors

4. **Bedrock**
   - High error rate (>5%)
   - High latency (>30s)

### CloudWatch Dashboards

Create dashboard with:
- EB health status
- RDS CPU and connections
- S3 request metrics
- Bedrock invocation count
- SES delivery metrics

---

## Disaster Recovery

### Backup Strategy

1. **RDS**: Automated daily backups (7-day retention)
2. **S3**: Versioning enabled (optional)
3. **Code**: Git repository
4. **Configuration**: Environment variables documented

### Recovery Procedures

**Database Failure**:
1. Restore from latest RDS snapshot
2. Update connection string if endpoint changed
3. Verify data integrity

**S3 Failure**:
1. Files are durable (99.999999999%)
2. Re-upload from user if needed
3. No automatic backup required

**Application Failure**:
1. Redeploy from Git
2. Restore environment variables
3. Run database migrations

---

## Security Best Practices

1. **Encryption**
   - RDS: Encryption at rest and in transit
   - S3: Server-side encryption (SSE-S3)
   - CloudFront: HTTPS only

2. **Access Control**
   - S3: Private buckets with pre-signed URLs
   - RDS: Security group restrictions
   - IAM: Least privilege policies

3. **Secrets Management**
   - Environment variables for secrets
   - Never commit credentials to Git
   - Rotate keys regularly

4. **Network Security**
   - VPC for RDS (optional)
   - Security groups for EB and RDS
   - HTTPS enforced everywhere

5. **Monitoring**
   - CloudTrail for API audit logs
   - CloudWatch for metrics and alarms
   - GuardDuty for threat detection (optional)

---

## Troubleshooting

### Common Issues

**Issue**: Can't connect to RDS
- Check security group rules
- Verify EB security group has access
- Check connection string

**Issue**: S3 upload fails
- Check IAM permissions
- Verify bucket exists
- Check file size limits

**Issue**: Bedrock timeout
- Increase timeout setting
- Check model availability
- Verify IAM permissions

**Issue**: Email not sending
- Check SES sandbox mode
- Verify sender email
- Check bounce/complaint rate

### Debug Commands

```bash
# Check EB environment
aws elasticbeanstalk describe-environments --environment-names hirethemnow-prod --region us-east-1

# Check RDS status
aws rds describe-db-instances --db-instance-identifier hirethemnow-db --region us-east-1

# List S3 objects
aws s3 ls s3://hirethemnow-files/resumes/

# Test Bedrock access
aws bedrock-runtime invoke-model --model-id amazon.nova-pro-v1:0 --body '{"messages":[{"role":"user","content":[{"text":"test"}]}],"inferenceConfig":{"maxTokens":10}}' --region us-east-1 output.json
```

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

### Overview

HireThemNow uses AWS Bedrock for **dual-purpose AI processing** in a two-phase resume processing architecture:

1. **Phase 1 - Resume Parsing**: Converts unstructured PDF text into structured JSON data
2. **Phase 2 - ATS Analysis**: Analyzes structured content for ATS compatibility and scoring

Both phases use the same Amazon Nova Pro model but with different configurations optimized for their specific purposes.

### Model Configuration

- **Model ID**: `amazon.nova-pro-v1:0`
- **Provider**: Amazon
- **Type**: Large Language Model
- **Region**: us-east-1
- **Usage**: Dual-purpose (parsing + analysis)

### Dual Configuration Architecture

The system implements **separate Bedrock configurations** for parsing and analysis phases to optimize each operation:

#### Phase 1: Resume Parsing Configuration

**Purpose**: Convert extracted PDF text into structured JSON format

```json
{
  "ResumeParsing": {
    "BedrockModelId": "amazon.nova-pro-v1:0",
    "ParsingTimeoutSeconds": 30
  }
}
```

**Hardcoded Parameters** (optimized for consistency):
- **Temperature**: `0.0` - Maximum consistency for data extraction
- **MaxTokens**: `4096` - Sufficient for structured JSON output
- **TopP**: `0.9` - Standard setting for parsing operations

#### Phase 2: ATS Analysis Configuration

**Purpose**: Perform detailed ATS analysis and generate recommendations

```json
{
  "ResumeParsing": {
    "AnalysisBedrockModelId": "amazon.nova-pro-v1:0",
    "AnalysisTimeoutSeconds": 45,
    "AnalysisMaxTokens": 8192,
    "AnalysisTemperature": 0.2,
    "AnalysisTopP": 0.9
  }
}
```

**Configuration Parameters**:
- **AnalysisBedrockModelId**: Model used for ATS analysis (can be different from parsing model)
- **AnalysisTimeoutSeconds**: `45` - Longer timeout for complex analysis operations
- **AnalysisMaxTokens**: `8192` - Higher token limit for detailed analysis and recommendations
- **AnalysisTemperature**: `0.2` - Low temperature for consistent scoring and recommendations
- **AnalysisTopP**: `0.9` - High TopP for diverse but relevant feedback

### Complete Configuration Example

```json
{
  "ResumeParsing": {
    "MaxFileSizeBytes": 5242880,
    "ParsingTimeoutSeconds": 30,
    "AnalysisTimeoutSeconds": 45,
    "SupportedFormats": ["pdf"],
    "EnableBackgroundProcessing": true,
    "PollingIntervalSeconds": 10,
    "MaxConcurrentProcessing": 3,
    "BedrockModelId": "amazon.nova-pro-v1:0",
    "AnalysisBedrockModelId": "amazon.nova-pro-v1:0",
    "AnalysisMaxTokens": 8192,
    "AnalysisTemperature": 0.2,
    "AnalysisTopP": 0.9
  }
}
```

### API Usage Examples

#### Phase 1: Resume Parsing API Call

```csharp
// Parsing configuration - optimized for consistency
var parsingRequestBody = new
{
    messages = new[]
    {
        new
        {
            role = "user",
            content = new[] { new { text = parsingPrompt } }
        }
    },
    inferenceConfig = new
    {
        maxTokens = 4096,        // Sufficient for JSON structure
        temperature = 0.0,       // Maximum consistency
        topP = 0.9              // Standard setting
    }
};

var parsingResponse = await _bedrockClient.InvokeModelAsync(new InvokeModelRequest
{
    ModelId = _configuration["ResumeParsing:BedrockModelId"], // amazon.nova-pro-v1:0
    Body = JsonSerializer.SerializeToUtf8Bytes(parsingRequestBody),
    ContentType = "application/json"
});
```

#### Phase 2: ATS Analysis API Call

```csharp
// Analysis configuration - optimized for detailed feedback
var analysisRequestBody = new
{
    messages = new[]
    {
        new
        {
            role = "user",
            content = new[] { new { text = analysisPrompt } }
        }
    },
    inferenceConfig = new
    {
        maxTokens = int.Parse(_configuration["ResumeParsing:AnalysisMaxTokens"]), // 8192
        temperature = double.Parse(_configuration["ResumeParsing:AnalysisTemperature"]), // 0.2
        topP = double.Parse(_configuration["ResumeParsing:AnalysisTopP"]) // 0.9
    }
};

var analysisResponse = await _bedrockClient.InvokeModelAsync(new InvokeModelRequest
{
    ModelId = _configuration["ResumeParsing:AnalysisBedrockModelId"], // amazon.nova-pro-v1:0
    Body = JsonSerializer.SerializeToUtf8Bytes(analysisRequestBody),
    ContentType = "application/json"
});
```

### Configuration Benefits

This dual configuration approach provides:

1. **Optimized Performance**: Each phase uses settings tuned for its specific purpose
2. **Independent Scaling**: Parsing and analysis can use different models or configurations
3. **Cost Control**: Different token limits and timeouts based on operation complexity
4. **Quality Assurance**: Parsing prioritizes consistency while analysis balances consistency with detailed feedback
5. **Flexibility**: Easy to adjust parameters for each phase independently

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

**Notes**:
- Same permissions required for both parsing and analysis operations
- Both phases use the same model (`amazon.nova-pro-v1:0`) but with different configurations
- If using different models for parsing vs analysis, add additional resource ARNs

### Cost Optimization

#### Pricing Model
- **On-demand pricing**: Pay per token for both parsing and analysis
- **Dual usage**: Each resume requires two Bedrock calls (parsing + analysis)
- **Token consumption**: 
  - Parsing: ~4,096 tokens per resume (structured output)
  - Analysis: ~8,192 tokens per resume (detailed feedback)
  - Total: ~12,288 tokens per complete resume processing

#### Cost Reduction Strategies
1. **Optimize prompts**: Reduce token usage while maintaining quality
2. **Batch processing**: Process multiple resumes efficiently in background service
3. **Timeout management**: 
   - Parsing: 30 seconds to prevent long-running requests
   - Analysis: 45 seconds for complex analysis operations
4. **Error handling**: Avoid unnecessary retries that increase costs
5. **Configuration tuning**: 
   - Use lower maxTokens for parsing (4,096 vs 8,192)
   - Optimize temperature settings to reduce variability
6. **Caching considerations**: Consider caching common analysis patterns (future enhancement)

#### Cost Monitoring
- Monitor token usage per phase (parsing vs analysis)
- Track cost per resume processed
- Set up CloudWatch alarms for unexpected usage spikes
- Review monthly Bedrock costs and optimize accordingly

### Monitoring

#### CloudWatch Logs
- **All Bedrock API calls logged**: Both parsing and analysis operations
- **Log Groups**: `/aws/elasticbeanstalk/hirethemnow-prod`
- **Log Patterns**: 
  - Parsing operations: Search for "ResumeParsingService"
  - Analysis operations: Search for "ResumeAnalysisService" or "ATS analysis"
  - Background service: Search for "ResumeParsingBackgroundService"

#### Metrics to Track
1. **Invocation Metrics**:
   - Total Bedrock invocations (parsing + analysis)
   - Parsing invocation count
   - Analysis invocation count
   - Success/failure rates per phase

2. **Performance Metrics**:
   - Parsing latency (target: <10 seconds)
   - Analysis latency (target: <15 seconds)
   - End-to-end processing time (parsing + analysis)
   - Token consumption per phase

3. **Error Metrics**:
   - Parsing error rate (target: <5%)
   - Analysis error rate (target: <5%)
   - Timeout occurrences per phase
   - Retry attempts and success rates

#### CloudWatch Alarms

Set up alarms for:
1. **High Error Rate**: >5% for either parsing or analysis
2. **High Latency**: 
   - Parsing: >30 seconds
   - Analysis: >45 seconds
3. **Token Usage Spikes**: Unusual increases in token consumption
4. **Service Availability**: Bedrock service errors or throttling

#### Analysis-Specific Monitoring

Additional monitoring for the analysis phase:
- **Analysis completion rate**: Percentage of analyses that complete successfully after parsing
- **Analysis retry rate**: How often analyses need to be retried
- **Score distribution**: Monitor ATS score distributions to identify potential issues
- **Processing queue depth**: Number of analyses waiting for processing

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

**Analysis Operations**: The `bedrock:InvokeModel` permission covers both parsing and analysis operations. No additional permissions are required for the dual-phase processing architecture.

### Best Practices

1. **Least Privilege**: Only grant necessary permissions
2. **Rotate Keys**: Rotate access keys every 90 days
3. **Use Roles**: Use IAM roles for EC2 instances
4. **Enable MFA**: For console access
5. **Monitor Access**: CloudTrail for audit logs

---

## Cost Optimization

### Monthly Cost Estimates

**Development** (~$30-35/month):
- Elastic Beanstalk (t3.micro): $8
- RDS (db.t3.micro): $15
- S3 + CloudFront: $2
- **Bedrock (dual-phase processing)**: $5-10 (estimated 100-200 resumes/month)

**Production** (~$75-90/month):
- Elastic Beanstalk (t3.small): $17
- RDS (db.t3.small): $30
- S3 + CloudFront: $15
- **Bedrock (dual-phase processing)**: $13-28 (estimated 500-1000 resumes/month)

### Bedrock Cost Analysis

#### Token-Based Pricing
- **Amazon Nova Pro**: ~$0.0008 per 1K input tokens, ~$0.0032 per 1K output tokens
- **Per Resume Processing**:
  - Parsing: ~4K input + 4K output tokens = ~$0.016 per resume
  - Analysis: ~4K input + 8K output tokens = ~$0.029 per resume
  - **Total per resume**: ~$0.045 (parsing + analysis)

#### Volume Estimates
- **100 resumes/month**: ~$4.50
- **500 resumes/month**: ~$22.50
- **1000 resumes/month**: ~$45.00

### Cost Reduction Tips

1. **Infrastructure Optimization**:
   - Use Free Tier: First 12 months
   - Reserved Instances: 1-year commitment for 30% savings
   - RDS: Use db.t3.micro for development
   - CloudFront: Use regional edge locations only
   - S3 Lifecycle: Delete old files after 90 days

2. **Bedrock Cost Optimization**:
   - **Optimize prompts**: Reduce token usage while maintaining quality
   - **Efficient parsing**: Use structured prompts to minimize output tokens
   - **Analysis tuning**: Balance detail level with token consumption
   - **Error handling**: Minimize failed requests that waste tokens
   - **Batch processing**: Process resumes efficiently to reduce overhead
   - **Monitor usage**: Track token consumption and set up cost alerts

3. **Analysis-Specific Optimizations**:
   - **Temperature settings**: Use 0.2 for consistent, concise responses
   - **Token limits**: Set appropriate maxTokens (8192) to avoid unnecessary costs
   - **Retry logic**: Implement smart retry mechanisms to avoid duplicate processing
   - **Caching**: Consider caching common analysis patterns (future enhancement)

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

4. **Bedrock (Dual-Phase Processing)**
   - **Parsing Phase**:
     - High error rate (>5%)
     - High latency (>30s)
     - Token usage spikes
   - **Analysis Phase**:
     - High error rate (>5%)
     - High latency (>45s)
     - Analysis completion rate drops (<90%)
     - High retry rate (>10%)

### CloudWatch Dashboards

Create dashboard with:
- EB health status
- RDS CPU and connections
- S3 request metrics
- **Bedrock metrics (dual-phase)**:
  - Parsing invocation count and success rate
  - Analysis invocation count and success rate
  - Token consumption by phase
  - End-to-end processing time
  - Queue depth for both phases
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

**Issue**: Bedrock parsing timeout
- Increase ParsingTimeoutSeconds setting (default: 30s)
- Check model availability for amazon.nova-pro-v1:0
- Verify IAM permissions for bedrock:InvokeModel
- Check PDF complexity and size

**Issue**: Bedrock analysis timeout
- Increase AnalysisTimeoutSeconds setting (default: 45s)
- Check if parsing completed successfully first
- Verify analysis model availability
- Review AnalysisMaxTokens setting (default: 8192)

**Issue**: Analysis stuck in "waiting_for_parsing"
- Check parsing status first - analysis depends on parsing completion
- Verify ResumeContent has "completed" status
- Check background service logs for parsing errors
- Ensure parsing and analysis are properly linked via resume_content_id

**Issue**: High analysis failure rate
- Check AnalysisTemperature and AnalysisTopP settings
- Verify structured content from parsing phase is valid
- Review analysis prompt for token limit issues
- Check for Bedrock service throttling or quotas

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

# Test Bedrock access (parsing configuration)
aws bedrock-runtime invoke-model --model-id amazon.nova-pro-v1:0 --body '{"messages":[{"role":"user","content":[{"text":"test parsing"}]}],"inferenceConfig":{"maxTokens":4096,"temperature":0.0,"topP":0.9}}' --region us-east-1 parsing-test.json

# Test Bedrock access (analysis configuration)
aws bedrock-runtime invoke-model --model-id amazon.nova-pro-v1:0 --body '{"messages":[{"role":"user","content":[{"text":"test analysis"}]}],"inferenceConfig":{"maxTokens":8192,"temperature":0.2,"topP":0.9}}' --region us-east-1 analysis-test.json

# Check parsing logs
aws logs filter-log-events --log-group-name /aws/elasticbeanstalk/hirethemnow-prod --filter-pattern "ResumeParsingService" --start-time $(date -d '1 hour ago' +%s)000

# Check analysis logs
aws logs filter-log-events --log-group-name /aws/elasticbeanstalk/hirethemnow-prod --filter-pattern "ResumeAnalysisService" --start-time $(date -d '1 hour ago' +%s)000

# Check background service logs
aws logs filter-log-events --log-group-name /aws/elasticbeanstalk/hirethemnow-prod --filter-pattern "ResumeParsingBackgroundService" --start-time $(date -d '1 hour ago' +%s)000
```

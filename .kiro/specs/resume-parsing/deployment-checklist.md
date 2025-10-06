# Resume Parsing Deployment Checklist

## Pre-Deployment

### ✅ Code Changes
- [x] Added AWSSDK.BedrockRuntime package
- [x] Added AWSSDK.Textract package
- [x] Implemented Textract text extraction
- [x] Implemented Claude 3 structuring
- [x] Added background processing service
- [x] Updated error handling and logging
- [x] Fixed S3 bucket configuration consistency

### ✅ Configuration Files
- [x] appsettings.json updated with:
  - `ResumeParsing:EnableBackgroundProcessing: true`
  - `ResumeParsing:PollingIntervalSeconds: 10`
  - `ResumeParsing:MaxConcurrentProcessing: 3`
  - `ResumeParsing:BedrockModelId: anthropic.claude-3-sonnet-20240229-v1:0`
  - `AWS:S3:BucketName: hirethemnow-files`

### ✅ Database
- [x] ResumeContents table exists
- [x] Migration files up to date
- [x] Database connection string configured

## AWS Configuration

### 🔧 IAM Permissions

Create/update IAM role with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3Access",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::hirethemnow-files/*"
    },
    {
      "Sid": "TextractAccess",
      "Effect": "Allow",
      "Action": [
        "textract:DetectDocumentText"
      ],
      "Resource": "*"
    },
    {
      "Sid": "BedrockAccess",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0"
    }
  ]
}
```

### 🔧 Bedrock Model Access

1. Go to AWS Bedrock Console
2. Navigate to "Model access"
3. Request access to: **Anthropic Claude 3 Sonnet**
4. Wait for approval (usually instant)
5. Verify model is available in your region

### 🔧 S3 Bucket

Verify bucket structure:
```
hirethemnow-files/
├── profile-pictures/
└── resumes/
    └── YYYY/MM/DD/
```

### 🔧 Environment Variables

Set these in your deployment environment:

**Option 1: Using IAM Role (Recommended for EC2/ECS)**
- No environment variables needed
- Attach IAM role to instance/task

**Option 2: Using Access Keys**
```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

**Required for both options:**
```bash
JWT_SECRET=your-jwt-secret
DATABASE_HOST=your-db-host
DATABASE_NAME=hirethemnow
DATABASE_USER=your-db-user
DATABASE_PASSWORD=your-db-password
```

## Deployment Steps

### 1. Build and Test Locally

```bash
# Build
cd HireThemNoW.Server
dotnet build

# Run locally
dotnet run

# Test endpoints
curl http://localhost:5219/api/resume/status
```

### 2. Run Database Migrations

```bash
# Migrations run automatically on startup
# Or run manually:
dotnet ef database update
```

### 3. Deploy Backend

```powershell
# Using your existing deployment script
.\deploy-backend.ps1
```

### 4. Verify Deployment

#### Check Application Logs
```bash
# Look for these log messages:
[Information] Resume parsing background service initialized with polling interval: 10s
[Information] Resume parsing background service starting
```

#### Test Upload
```bash
curl -X POST https://api.hirethemnow.xyz/api/resume/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "resume=@test-resume.pdf"
```

Expected response:
```json
{
  "success": true,
  "message": "Resume uploaded successfully! We're parsing your resume in the background.",
  "data": {
    "resumeUrl": "resumes/2025/01/06/...",
    "fileName": "test-resume.pdf",
    "status": "pending",
    "parsingStatus": "pending",
    "parsingId": 123
  }
}
```

#### Check Parsing Status (wait 10-15 seconds)
```bash
curl https://api.hirethemnow.xyz/api/resume/parsing-status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "message": "Parsing status retrieved successfully",
  "data": {
    "id": 123,
    "fileName": "test-resume.pdf",
    "status": "completed",
    "uploadedAt": "2025-01-06T10:00:00Z",
    "parsedAt": "2025-01-06T10:00:12Z",
    "error": null
  }
}
```

#### Get Parsed Content
```bash
curl https://api.hirethemnow.xyz/api/resume/content \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "message": "Resume content retrieved successfully",
  "data": {
    "id": 123,
    "fileName": "test-resume.pdf",
    "parsedContent": "{...structured JSON...}",
    "textContent": "Plain text...",
    "status": "completed"
  }
}
```

## Post-Deployment Monitoring

### CloudWatch Logs

Monitor for these patterns:

**Success Pattern:**
```
[Information] Starting resume parsing for S3 URL: s3://hirethemnow-files/resumes/...
[Information] Text extraction completed in 3.45s, extracted 2,456 characters
[Information] Content structuring completed in 5.23s
[Information] Resume parsing completed successfully in 8.68s
```

**Error Pattern:**
```
[Error] Error extracting text from document: hirethemnow-files/resumes/...
[Error] Unexpected error parsing resume from S3 URL: s3://...
```

### Database Queries

**Check pending count:**
```sql
SELECT COUNT(*) FROM "ResumeContents" WHERE "ParsingStatus" = 'pending';
```

**Check failed parses:**
```sql
SELECT "Id", "FileName", "ParsingError", "UploadedAt" 
FROM "ResumeContents" 
WHERE "ParsingStatus" = 'failed' 
ORDER BY "UploadedAt" DESC 
LIMIT 10;
```

**Check average processing time:**
```sql
SELECT AVG(EXTRACT(EPOCH FROM ("ParsedAt" - "UploadedAt"))) as avg_seconds
FROM "ResumeContents" 
WHERE "ParsingStatus" = 'completed' 
AND "ParsedAt" IS NOT NULL;
```

### AWS Cost Monitoring

Monitor these services in AWS Cost Explorer:
- **Textract**: Should be ~$0.002-0.005 per resume
- **Bedrock**: Should be ~$0.020-0.025 per resume
- **S3**: Storage and data transfer costs

Set up billing alerts:
- Alert at $10/day
- Alert at $50/day
- Alert at $100/day

## Rollback Plan

If issues occur:

### 1. Disable Background Processing
```json
{
  "ResumeParsing": {
    "EnableBackgroundProcessing": false
  }
}
```

Redeploy with this change. Resumes will stay in "pending" state.

### 2. Revert to Previous Version
```powershell
# Deploy previous version
git checkout <previous-commit>
.\deploy-backend.ps1
```

### 3. Manual Retry Failed Parses
```sql
-- Reset failed parses to pending
UPDATE "ResumeContents" 
SET "ParsingStatus" = 'pending', "ParsingError" = NULL 
WHERE "ParsingStatus" = 'failed';
```

## Troubleshooting

### Issue: Background service not starting
**Check:**
- `EnableBackgroundProcessing` is `true` in appsettings
- Application logs for startup errors
- Database connection is working

### Issue: Parsing fails with AccessDenied
**Check:**
- IAM permissions are correct
- Bedrock model access is granted
- S3 bucket permissions allow GetObject

### Issue: Parsing takes too long
**Check:**
- Document size (large PDFs take longer)
- Network connectivity to AWS
- CloudWatch for throttling errors

### Issue: High AWS costs
**Check:**
- Number of parses per day
- Failed parses being retried repeatedly
- Implement caching for duplicate files

## Success Criteria

✅ Deployment is successful if:
- [ ] Application starts without errors
- [ ] Background service logs show it's running
- [ ] Test resume uploads successfully
- [ ] Parsing completes within 15 seconds
- [ ] Parsed content is structured correctly
- [ ] No errors in CloudWatch logs
- [ ] Database shows completed parses
- [ ] AWS costs are within expected range

## Support Contacts

- **AWS Support**: For Bedrock/Textract issues
- **Database Admin**: For database issues
- **DevOps**: For deployment issues

## Documentation Links

- [Background Processing Architecture](./background-processing-architecture.md)
- [Bedrock Integration Guide](./bedrock-integration-guide.md)
- [Error Handling Summary](./error-handling-summary.md)
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [AWS Textract Documentation](https://docs.aws.amazon.com/textract/)

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
DATABASE_HOST=hirethemnow-db.abc123.us-east-1.rds.amazonaws.com
DATABASE_NAME=postgres
DATABASE_USER=postgres
DATABASE_PASSWORD=your-secure-database-password

# AWS Services
AWS__S3__BucketName=hirethemnow-files

# Resume Parsing Configuration
RESUMEPARSING__MAXFILESIZEBYTES=5242880
RESUMEPARSING__PARSINGTIMEOUTSECONDS=30
RESUMEPARSING__ANALYSISTIMEOUTSECONDS=45
RESUMEPARSING__SUPPORTEDFORMATS__0=pdf
RESUMEPARSING__ENABLEBACKGROUNDPROCESSING=true
RESUMEPARSING__POLLINGINTERVALSECONDS=10
RESUMEPARSING__MAXCONCURRENTPROCESSING=3
RESUMEPARSING__BEDROCKMODELID=amazon.nova-pro-v1:0
RESUMEPARSING__ANALYSISBEDROCKMODELID=amazon.nova-pro-v1:0
RESUMEPARSING__ANALYSISMAXTOKENS=8192
RESUMEPARSING__ANALYSISTEMPERATURE=0.2
RESUMEPARSING__ANALYSISTOPP=0.9
```

### Configuration Validation

The application validates all ResumeParsing configuration options during startup in `Program.cs`. The following validations are performed:

**Required Configuration Sections:**
- `ResumeParsing` section must be present in appsettings.json or environment variables
- Database connection string must be valid
- AWS credentials must be configured
- JWT secret must be at least 32 characters

**ResumeParsing Configuration Validation:**
- `MaxFileSizeBytes`: Must be positive integer (default: 5242880 = 5MB)
- `ParsingTimeoutSeconds`: Must be positive integer (default: 30)
- `AnalysisTimeoutSeconds`: Must be positive integer (default: 45)
- `SupportedFormats`: Must contain at least one format (default: ["pdf"])
- `EnableBackgroundProcessing`: Boolean flag (default: true)
- `PollingIntervalSeconds`: Must be positive integer (default: 10)
- `MaxConcurrentProcessing`: Must be positive integer (default: 3)
- `BedrockModelId`: Must be valid Amazon Bedrock model ID (default: amazon.nova-pro-v1:0)
- `AnalysisBedrockModelId`: Must be valid Amazon Bedrock model ID (default: amazon.nova-pro-v1:0)
- `AnalysisMaxTokens`: Must be positive integer (default: 8192)
- `AnalysisTemperature`: Must be between 0.0 and 1.0 (default: 0.2)
- `AnalysisTopP`: Must be between 0.0 and 1.0 (default: 0.9)

**Startup Validation Process:**
1. Configuration binding and validation occurs during service registration
2. Missing required configurations cause application startup to fail with descriptive error messages
3. Invalid configuration values are logged with specific validation errors
4. Database connectivity is tested during startup
5. AWS service accessibility is verified during first use

### Production Configuration Examples

**Complete appsettings.Production.json:**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=${DATABASE_HOST};Database=${DATABASE_NAME};Username=${DATABASE_USER};Password=${DATABASE_PASSWORD};"
  },
  "Jwt": {
    "Secret": "${JWT_SECRET}",
    "Issuer": "HireThemNow",
    "Audience": "HireThemNowUsers",
    "ExpirationDays": 7
  },
  "Google": {
    "ClientId": "${GOOGLE_CLIENT_ID}",
    "ClientSecret": "${GOOGLE_CLIENT_SECRET}"
  },
  "AWS": {
    "Region": "us-east-1",
    "S3": {
      "BucketName": "${AWS__S3__BucketName}"
    }
  },
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
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  }
}
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
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=GOOGLE_CLIENT_SECRET,Value=your-client-secret `
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=AWS__S3__BucketName,Value=hirethemnow-files `
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=RESUMEPARSING__MAXFILESIZEBYTES,Value=5242880 `
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=RESUMEPARSING__PARSINGTIMEOUTSECONDS,Value=30 `
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=RESUMEPARSING__ANALYSISTIMEOUTSECONDS,Value=45 `
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=RESUMEPARSING__SUPPORTEDFORMATS__0,Value=pdf `
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=RESUMEPARSING__ENABLEBACKGROUNDPROCESSING,Value=true `
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=RESUMEPARSING__POLLINGINTERVALSECONDS,Value=10 `
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=RESUMEPARSING__MAXCONCURRENTPROCESSING,Value=3 `
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=RESUMEPARSING__BEDROCKMODELID,Value=amazon.nova-pro-v1:0 `
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=RESUMEPARSING__ANALYSISBEDROCKMODELID,Value=amazon.nova-pro-v1:0 `
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=RESUMEPARSING__ANALYSISMAXTOKENS,Value=8192 `
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=RESUMEPARSING__ANALYSISTEMPERATURE,Value=0.2 `
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=RESUMEPARSING__ANALYSISTOPP,Value=0.9
```

**Alternative: Set via Elastic Beanstalk Console**

You can also set these environment variables through the AWS Elastic Beanstalk console:

1. Navigate to your environment in the EB console
2. Go to Configuration → Software
3. Add the following environment properties:

| Property Name | Value | Description |
|---------------|-------|-------------|
| `DATABASE_HOST` | your-db-host | RDS endpoint |
| `DATABASE_NAME` | postgres | Database name |
| `DATABASE_USER` | postgres | Database username |
| `DATABASE_PASSWORD` | your-password | Database password |
| `JWT_SECRET` | your-secret | JWT signing secret (32+ chars) |
| `GOOGLE_CLIENT_ID` | your-client-id | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | your-client-secret | Google OAuth client secret |
| `AWS__S3__BucketName` | hirethemnow-files | S3 bucket for file storage |
| `RESUMEPARSING__MAXFILESIZEBYTES` | 5242880 | Max resume file size (5MB) |
| `RESUMEPARSING__PARSINGTIMEOUTSECONDS` | 30 | Parsing timeout |
| `RESUMEPARSING__ANALYSISTIMEOUTSECONDS` | 45 | Analysis timeout |
| `RESUMEPARSING__SUPPORTEDFORMATS__0` | pdf | Supported file format |
| `RESUMEPARSING__ENABLEBACKGROUNDPROCESSING` | true | Enable background service |
| `RESUMEPARSING__POLLINGINTERVALSECONDS` | 10 | Background polling interval |
| `RESUMEPARSING__MAXCONCURRENTPROCESSING` | 3 | Max concurrent operations |
| `RESUMEPARSING__BEDROCKMODELID` | amazon.nova-pro-v1:0 | Bedrock model for parsing |
| `RESUMEPARSING__ANALYSISBEDROCKMODELID` | amazon.nova-pro-v1:0 | Bedrock model for analysis |
| `RESUMEPARSING__ANALYSISMAXTOKENS` | 8192 | Max tokens for analysis |
| `RESUMEPARSING__ANALYSISTEMPERATURE` | 0.2 | Analysis temperature setting |
| `RESUMEPARSING__ANALYSISTOPP` | 0.9 | Analysis TopP setting |

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

### Service Dependencies and Registration

The application uses dependency injection to manage service lifecycles. All services are registered in `Program.cs` during application startup.

#### Core Service Registration

```csharp
// Data and storage services
builder.Services.AddScoped<IDataService, DatabaseDataService>();
builder.Services.AddScoped<IS3Service, S3Service>();
builder.Services.AddScoped<IEmailService, EmailService>();

// Resume processing services (two-phase architecture)
builder.Services.AddScoped<IResumeParsingService, ResumeParsingService>();
builder.Services.AddScoped<IResumeAnalysisService, ResumeAnalysisService>();
builder.Services.AddScoped<IBedrockAgentService, BedrockAgentService>();

// Background processing services
builder.Services.AddHostedService<ResumeParsingBackgroundService>();

// Database context
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));
```

#### Service Dependencies

**ResumeAnalysisService Dependencies:**
- `ApplicationDbContext`: Database operations
- `ILogger<ResumeAnalysisService>`: Structured logging
- `IBedrockAgentService`: AWS Bedrock AI integration
- `IEmailService`: Analysis completion notifications

**ResumeParsingBackgroundService Dependencies:**
- `IServiceProvider`: Service scope management
- `ILogger<ResumeParsingBackgroundService>`: Background service logging
- `IResumeParsingService`: Phase 1 processing (via scoped service)
- `IResumeAnalysisService`: Phase 2 processing (via scoped service)

**BedrockAgentService Dependencies:**
- `IConfiguration`: ResumeParsing configuration section
- `ILogger<BedrockAgentService>`: AWS service logging
- AWS SDK clients (configured via environment variables)

#### Service Startup Sequence

1. **Configuration Validation**: ResumeParsing configuration is validated during service registration
2. **Database Context**: Entity Framework context is configured with PostgreSQL connection
3. **Service Registration**: All scoped and singleton services are registered
4. **Background Services**: Hosted services (ResumeParsingBackgroundService) are registered last
5. **Application Startup**: Services are instantiated as needed during first request
6. **Background Service Start**: ResumeParsingBackgroundService starts automatically after application startup

#### Health Check Procedures

**Application Health Verification:**

```powershell
# Check application health endpoint
curl https://api.hirethemnow.xyz/api/health/aws-services

# Expected response for healthy services:
{
  "allServicesHealthy": true,
  "s3": { "isAccessible": true, "bucketName": "hirethemnow-files" },
  "bedrock": { "isAccessible": true, "modelId": "amazon.nova-pro-v1:0" },
  "checkedAt": "2025-01-01T00:00:00Z"
}
```

**Service-Specific Health Checks:**

1. **Database Connectivity**:
   ```powershell
   # Test database connection
   psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME -c "SELECT 1;"
   ```

2. **S3 Service Health**:
   ```powershell
   # Test S3 bucket access
   aws s3 ls s3://hirethemnow-files/ --region us-east-1
   ```

3. **Bedrock Service Health**:
   ```powershell
   # Test Bedrock model access
   aws bedrock-runtime invoke-model \
     --model-id amazon.nova-pro-v1:0 \
     --body '{"messages":[{"role":"user","content":[{"text":"test"}]}],"inferenceConfig":{"maxTokens":100,"temperature":0.0}}' \
     --region us-east-1 test-output.json
   ```

4. **Background Service Health**:
   ```powershell
   # Check background service logs for activity
   aws logs filter-log-events \
     --log-group-name /aws/elasticbeanstalk/hirethemnow-prod \
     --filter-pattern "ResumeParsingBackgroundService" \
     --start-time $(date -d '10 minutes ago' +%s)000
   ```

#### Service Startup Troubleshooting

**Issue**: Services fail to register during startup
```powershell
# Check application logs for service registration errors
aws logs filter-log-events \
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod \
  --filter-pattern "ERROR.*service" \
  --start-time $(date -d '1 hour ago' +%s)000
```

**Issue**: Background service not starting
```powershell
# Check for ResumeParsingBackgroundService startup logs
aws logs filter-log-events \
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod \
  --filter-pattern "ResumeParsingBackgroundService.*starting" \
  --start-time $(date -d '1 hour ago' +%s)000
```

**Issue**: Configuration validation failures
```powershell
# Check for configuration validation errors
aws logs filter-log-events \
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod \
  --filter-pattern "configuration.*validation" \
  --start-time $(date -d '1 hour ago' +%s)000
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

#### General Log Monitoring

```powershell
# View recent logs
aws logs tail /aws/elasticbeanstalk/hirethemnow-prod/var/log/web.stdout.log --follow

# Search for general errors
aws logs filter-log-events `
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod `
  --filter-pattern "ERROR" `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# Search for warnings
aws logs filter-log-events `
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod `
  --filter-pattern "WARNING" `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
```

#### Analysis-Specific Log Patterns

**Resume Analysis Service Logs:**
```powershell
# Search for analysis operations
aws logs filter-log-events `
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod `
  --filter-pattern "ResumeAnalysisService" `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# Search for ATS analysis completion
aws logs filter-log-events `
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod `
  --filter-pattern "ATS analysis completed" `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# Search for analysis errors
aws logs filter-log-events `
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod `
  --filter-pattern "analysis.*error" `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# Search for analysis timeouts
aws logs filter-log-events `
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod `
  --filter-pattern "analysis.*timeout" `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
```

**Background Service Logs:**
```powershell
# Search for background service activity
aws logs filter-log-events `
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod `
  --filter-pattern "ResumeParsingBackgroundService" `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# Search for dual-phase processing logs
aws logs filter-log-events `
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod `
  --filter-pattern "Phase.*processing" `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# Search for processing queue status
aws logs filter-log-events `
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod `
  --filter-pattern "pending.*analysis" `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
```

**Bedrock Integration Logs:**
```powershell
# Search for Bedrock API calls
aws logs filter-log-events `
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod `
  --filter-pattern "Bedrock.*analysis" `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# Search for Bedrock errors
aws logs filter-log-events `
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod `
  --filter-pattern "Bedrock.*error" `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# Search for token usage patterns
aws logs filter-log-events `
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod `
  --filter-pattern "tokens.*analysis" `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
```

#### Performance Monitoring Logs

```powershell
# Search for analysis performance metrics
aws logs filter-log-events `
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod `
  --filter-pattern "analysis.*completed.*seconds" `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# Search for slow operations (>30 seconds)
aws logs filter-log-events `
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod `
  --filter-pattern "completed.*[3-9][0-9].*seconds" `
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

#### Application Health Checks

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

# Test application health endpoint
curl -s https://api.hirethemnow.xyz/api/health/aws-services | jq '.'
```

#### Analysis System Health Checks

**Resume Analysis Service Health:**
```powershell
# Check analysis service availability
curl -s -H "Authorization: Bearer $JWT_TOKEN" \
  https://api.hirethemnow.xyz/api/resume/analysis/status

# Expected responses:
# - 404: No analysis found (normal for new users)
# - 200/202: Analysis found with status information
# - 401: Authentication required
# - 500: Service error (investigate)
```

**Background Service Health:**
```powershell
# Check if background service is processing
aws logs filter-log-events \
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod \
  --filter-pattern "ResumeParsingBackgroundService.*polling" \
  --start-time $(date -d '5 minutes ago' +%s)000 \
  --max-items 5

# Should show recent polling activity every 10 seconds
```

**Bedrock Service Health:**
```powershell
# Test Bedrock connectivity for analysis
aws bedrock-runtime invoke-model \
  --model-id amazon.nova-pro-v1:0 \
  --body '{"messages":[{"role":"user","content":[{"text":"health check"}]}],"inferenceConfig":{"maxTokens":100,"temperature":0.2,"topP":0.9}}' \
  --region us-east-1 \
  bedrock-health-check.json

# Check response
cat bedrock-health-check.json | jq '.content[0].text'
```

#### Analysis Status Monitoring

**Check Analysis Queue Depth:**
```powershell
# Monitor pending analyses
aws logs filter-log-events \
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod \
  --filter-pattern "pending.*analyses" \
  --start-time $(date -d '10 minutes ago' +%s)000

# Look for patterns like "Found X pending analyses"
```

**Check Analysis Success Rate:**
```powershell
# Count successful analyses in last hour
SUCCESSFUL=$(aws logs filter-log-events \
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod \
  --filter-pattern "ATS analysis completed" \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --query 'length(events)')

# Count failed analyses in last hour
FAILED=$(aws logs filter-log-events \
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod \
  --filter-pattern "analysis.*failed" \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --query 'length(events)')

echo "Successful: $SUCCESSFUL, Failed: $FAILED"
```

**Check Analysis Performance:**
```powershell
# Check average analysis time
aws logs filter-log-events \
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod \
  --filter-pattern "analysis completed in" \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --query 'events[*].message' \
  --output text | grep -o '[0-9]*\.[0-9]*s' | head -10
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

### Analysis System Issues

**Issue**: Analysis stuck in "waiting_for_parsing" status
```powershell
# Check parsing status first - analysis depends on parsing completion
curl -s -H "Authorization: Bearer $JWT_TOKEN" \
  https://api.hirethemnow.xyz/api/resume/parsing-status

# If parsing is failed, user needs to re-upload resume
# If parsing is still processing, wait for completion
# If parsing is completed but analysis still waiting, check background service

# Check background service logs for analysis processing
aws logs filter-log-events \
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod \
  --filter-pattern "ResumeAnalysisService.*waiting_for_parsing" \
  --start-time $(date -d '10 minutes ago' +%s)000
```

**Issue**: Analysis stuck in "processing" status for >2 minutes
```powershell
# Check for analysis timeout errors
aws logs filter-log-events \
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod \
  --filter-pattern "analysis.*timeout" \
  --start-time $(date -d '10 minutes ago' +%s)000

# Check Bedrock service errors
aws logs filter-log-events \
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod \
  --filter-pattern "Bedrock.*error" \
  --start-time $(date -d '10 minutes ago' +%s)000

# Recommend user to retry analysis
curl -X POST -H "Authorization: Bearer $JWT_TOKEN" \
  https://api.hirethemnow.xyz/api/resume/analysis/retry
```

**Issue**: High analysis failure rate (>10%)
```powershell
# Check Bedrock service availability
aws bedrock-runtime invoke-model \
  --model-id amazon.nova-pro-v1:0 \
  --body '{"messages":[{"role":"user","content":[{"text":"test"}]}],"inferenceConfig":{"maxTokens":100,"temperature":0.2}}' \
  --region us-east-1 test.json

# Check for quota/throttling issues
aws logs filter-log-events \
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod \
  --filter-pattern "throttling|quota|rate.*limit" \
  --start-time $(date -d '1 hour ago' +%s)000

# Check configuration issues
aws elasticbeanstalk describe-configuration-settings \
  --environment-name hirethemnow-prod \
  --region us-east-1 | grep -i "RESUMEPARSING"
```

**Issue**: Background service not processing analyses
```powershell
# Check if background service is running
aws logs filter-log-events \
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod \
  --filter-pattern "ResumeParsingBackgroundService.*ExecuteAsync" \
  --start-time $(date -d '5 minutes ago' +%s)000

# Check for background service errors
aws logs filter-log-events \
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod \
  --filter-pattern "ResumeParsingBackgroundService.*ERROR" \
  --start-time $(date -d '30 minutes ago' +%s)000

# Restart application to restart background service
aws elasticbeanstalk restart-app-server \
  --environment-name hirethemnow-prod \
  --region us-east-1
```

**Issue**: Analysis results missing or incomplete
```powershell
# Check for JSON deserialization errors
aws logs filter-log-events \
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod \
  --filter-pattern "deserialization.*error" \
  --start-time $(date -d '1 hour ago' +%s)000

# Check for database save errors
aws logs filter-log-events \
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod \
  --filter-pattern "SaveChangesAsync.*error" \
  --start-time $(date -d '1 hour ago' +%s)000

# Verify database connectivity
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME \
  -c "SELECT COUNT(*) FROM resume_analyses WHERE status = 'completed';"
```

**Issue**: Slow analysis performance (>45 seconds)
```powershell
# Check Bedrock response times
aws logs filter-log-events \
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod \
  --filter-pattern "Bedrock.*completed.*[4-9][0-9].*seconds" \
  --start-time $(date -d '1 hour ago' +%s)000

# Check for token limit issues
aws logs filter-log-events \
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod \
  --filter-pattern "token.*limit" \
  --start-time $(date -d '1 hour ago' +%s)000

# Consider adjusting AnalysisTimeoutSeconds if needed
# Current default: 45 seconds
```

**Issue**: Analysis configuration errors
```powershell
# Verify all ResumeParsing configuration is set
aws elasticbeanstalk describe-configuration-settings \
  --environment-name hirethemnow-prod \
  --region us-east-1 \
  --query 'ConfigurationSettings[0].OptionSettings[?Namespace==`aws:elasticbeanstalk:application:environment`]' \
  --output table

# Check for missing required configuration
aws logs filter-log-events \
  --log-group-name /aws/elasticbeanstalk/hirethemnow-prod \
  --filter-pattern "configuration.*missing|configuration.*invalid" \
  --start-time $(date -d '1 hour ago' +%s)000

# Validate configuration values are within expected ranges
# AnalysisTemperature: 0.0-1.0 (default: 0.2)
# AnalysisTopP: 0.0-1.0 (default: 0.9)
# AnalysisMaxTokens: >0 (default: 8192)
```

### Analysis Troubleshooting Checklist

When analysis issues occur, follow this systematic approach:

1. **Check Analysis Status**:
   ```powershell
   curl -s -H "Authorization: Bearer $JWT_TOKEN" \
     https://api.hirethemnow.xyz/api/resume/analysis/status
   ```

2. **Verify Parsing Dependency**:
   ```powershell
   curl -s -H "Authorization: Bearer $JWT_TOKEN" \
     https://api.hirethemnow.xyz/api/resume/parsing-status
   ```

3. **Check Background Service Health**:
   ```powershell
   aws logs filter-log-events \
     --log-group-name /aws/elasticbeanstalk/hirethemnow-prod \
     --filter-pattern "ResumeParsingBackgroundService" \
     --start-time $(date -d '5 minutes ago' +%s)000 \
     --max-items 5
   ```

4. **Verify Bedrock Connectivity**:
   ```powershell
   aws bedrock-runtime invoke-model \
     --model-id amazon.nova-pro-v1:0 \
     --body '{"messages":[{"role":"user","content":[{"text":"test"}]}],"inferenceConfig":{"maxTokens":100}}' \
     --region us-east-1 test.json
   ```

5. **Check Configuration**:
   ```powershell
   aws elasticbeanstalk describe-configuration-settings \
     --environment-name hirethemnow-prod \
     --region us-east-1 | grep "RESUMEPARSING"
   ```

6. **Review Recent Errors**:
   ```powershell
   aws logs filter-log-events \
     --log-group-name /aws/elasticbeanstalk/hirethemnow-prod \
     --filter-pattern "ERROR.*analysis" \
     --start-time $(date -d '30 minutes ago' +%s)000
   ```

7. **If All Else Fails - Restart Services**:
   ```powershell
   aws elasticbeanstalk restart-app-server \
     --environment-name hirethemnow-prod \
     --region us-east-1
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

# HireThemNoW - Complete Deployment Guide

A modern job application tracking and resume analysis platform with AI-powered resume analysis.

**Live Demo:** https://hirethemnow.xyz
**API:** https://api.hirethemnow.xyz

---

## 🎬 How It Works

Watch the magic happen behind the scenes as your resume gets processed by our AI-powered platform:

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor': '#ff9900', 'primaryTextColor': '#232f3e', 'primaryBorderColor': '#ff9900', 'lineColor': '#10b981', 'secondaryColor': '#6b46c1', 'tertiaryColor': '#f59e0b'}}}%%
sequenceDiagram
    participant U as 👤 User
    participant CF as ☁️ CloudFront CDN
    participant S3F as 📦 S3 Frontend
    participant ELB as ⚖️ Load Balancer
    participant API as 🚀 .NET API
    participant S3R as 📄 S3 Resumes
    participant BG as ⚙️ Background Service
    participant PDF as 📖 PdfPig Parser
    participant AI as 🤖 Bedrock Nova Pro
    participant DB as 🗄️ PostgreSQL

    Note over U,DB: 🎯 Resume Upload & AI Processing Journey

    U->>+CF: 📤 Upload PDF Resume
    CF->>+S3F: 🌐 Serve React App
    S3F->>+ELB: 📋 POST /api/resumes
    ELB->>+API: 🔄 Route Request
    
    API->>+S3R: 💾 Store PDF (status: pending)
    S3R-->>-API: ✅ File Stored
    API-->>-ELB: 📊 Upload Success + Job ID
    ELB-->>-S3F: 🎉 Response
    S3F-->>-CF: 📱 Update UI
    CF-->>-U: ⏳ "Processing your resume..."

    Note over BG,AI: 🔄 Background AI Processing

    BG->>+S3R: 📥 Download PDF
    S3R-->>-BG: 📄 PDF File
    BG->>+PDF: 🔍 Extract Text
    PDF-->>-BG: 📝 Raw Text
    BG->>+AI: 🧠 Structure with AI
    AI-->>-BG: ✨ Structured Data
    BG->>+DB: 💾 Save Results
    DB-->>-BG: ✅ Stored

    Note over U,DB: 📊 Real-time Status Updates

    U->>+CF: 🔄 Check Status
    CF->>+S3F: 📱 Status Request
    S3F->>+ELB: 📊 GET /api/resumes/{id}/status
    ELB->>+API: 🔍 Query Status
    API->>+DB: 📋 Get Resume Data
    DB-->>-API: 📊 Structured Resume
    API-->>-ELB: 🎯 ATS Score + Data
    ELB-->>-S3F: 📈 Complete Results
    S3F-->>-CF: 🎉 Display Results
    CF-->>-U: ✅ "Resume processed! ATS Score: 85%"
```

### 🏗️ System Architecture Overview

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor': '#ff9900', 'primaryTextColor': '#232f3e', 'primaryBorderColor': '#ff9900', 'lineColor': '#10b981', 'secondaryColor': '#6b46c1', 'tertiaryColor': '#f59e0b'}}}%%
graph TB
    subgraph "🌐 Frontend Layer"
        U[👤 User] --> CF[☁️ CloudFront CDN]
        CF --> S3F[📦 S3 Static Hosting<br/>React 18 + Vite]
    end

    subgraph "⚖️ Load Balancing"
        ELB[🔄 Classic ELB<br/>HTTPS Termination]
    end

    subgraph "🚀 Backend Services"
        API[🎯 .NET 8 API<br/>ASP.NET Core<br/>Windows Server 2022 + IIS]
        BG[⚙️ Background Service<br/>Resume Processing]
    end

    subgraph "🤖 AI Processing"
        PDF[📖 PdfPig Parser<br/>Text Extraction]
        AI[🧠 AWS Bedrock<br/>Nova Pro Model]
    end

    subgraph "💾 Data Layer"
        DB[(🗄️ PostgreSQL 17.4<br/>RDS)]
        S3R[📄 S3 Bucket<br/>Resume Storage]
    end

    subgraph "🔐 Authentication"
        GOOGLE[🔑 Google OAuth]
        JWT[🎫 JWT Tokens]
    end

    S3F -.->|HTTPS| ELB
    ELB --> API
    API --> DB
    API --> S3R
    API --> GOOGLE
    API --> JWT
    
    BG -.->|Background| S3R
    BG --> PDF
    PDF --> AI
    AI -.->|Structured Data| DB

    classDef aws fill:#ff9900,stroke:#232f3e,stroke-width:2px,color:#fff
    classDef custom fill:#6b46c1,stroke:#fff,stroke-width:2px,color:#fff
    classDef ai fill:#10b981,stroke:#fff,stroke-width:2px,color:#fff
    classDef data fill:#f59e0b,stroke:#232f3e,stroke-width:2px,color:#232f3e

    class CF,ELB,S3F,S3R,DB aws
    class API,BG,PDF custom
    class AI ai
    class GOOGLE,JWT data
```

### 🔄 Resume Processing Pipeline

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor': '#ff9900', 'primaryTextColor': '#232f3e', 'primaryBorderColor': '#ff9900', 'lineColor': '#10b981', 'secondaryColor': '#6b46c1', 'tertiaryColor': '#f59e0b'}}}%%
flowchart LR
    A[📤 PDF Upload<br/>Max 5MB] --> B{📋 Validation}
    B -->|✅ Valid| C[💾 S3 Storage<br/>Status: Pending]
    B -->|❌ Invalid| X[🚫 Error Response]
    
    C --> D[⚙️ Background Queue<br/>Processing Starts]
    D --> E[📥 Download from S3]
    E --> F[📖 PdfPig Extraction<br/>Raw Text]
    F --> G[🤖 Bedrock Nova Pro<br/>AI Structuring]
    G --> H[📊 Generate ATS Score]
    H --> I[💾 Save to PostgreSQL<br/>Status: Complete]
    I --> J[🎉 Ready for User<br/>~30 seconds total]

    classDef process fill:#6b46c1,stroke:#fff,stroke-width:2px,color:#fff
    classDef storage fill:#ff9900,stroke:#232f3e,stroke-width:2px,color:#fff
    classDef ai fill:#10b981,stroke:#fff,stroke-width:2px,color:#fff
    classDef error fill:#ef4444,stroke:#fff,stroke-width:2px,color:#fff

    class A,D,F,H process
    class C,E,I storage
    class G ai
    class X error
```

### The Journey
1. **📤 Upload** - Drag & drop your PDF resume (max 5MB)
2. **🤖 Process** - AI extracts and structures your data using AWS Bedrock Nova Pro
3. **📊 Analyze** - Get ATS scores and professional insights
4. **📈 Track** - Monitor your job applications and progress

*⚡ Processing time: ~30 seconds for most resumes*

---

## 📋 Table of Contents

1. [Quick Start](#-quick-start)
2. [Prerequisites](#-prerequisites)
3. [Local Development](#-local-development)
4. [AWS Deployment](#-aws-deployment)
5. [Custom Domain Setup](#-custom-domain-setup)
6. [Troubleshooting](#-troubleshooting)
7. [Cost Estimates](#-monthly-cost-estimates)

---

## 🚀 Quick Start

### Deploy to AWS (Automated)

**⚠️ IMPORTANT: Create `.env.deploy` before deploying!**

```powershell
# Step 1: Copy the example file
cp .env.example .env.deploy

# Step 2: Edit .env.deploy with your actual credentials
# Required: AWS keys, JWT secret, Google OAuth, database password

# Step 3: Deploy backend
.\deploy-backend.ps1
# Answer prompts for database and HTTPS configuration

# Step 4: Deploy frontend
.\deploy-frontend.ps1
```

**🔒 Security:** `.env.deploy` is gitignored - never commit it!

---

## 📦 Prerequisites

### Required Tools

- **.NET 8 SDK** - [Download](https://dotnet.microsoft.com/download/dotnet/8.0)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **AWS CLI** - [Download](https://aws.amazon.com/cli/)
- **PowerShell** - For deployment scripts

### AWS Setup

1. Create AWS account
2. Create IAM user with permissions: EC2, S3, ElasticBeanstalk, RDS, ACM, CloudFront, Bedrock
3. Configure AWS CLI:
```powershell
aws configure
# Enter Access Key, Secret Key, region (us-east-1)
```

**Note:** Bedrock access is required for AI-powered resume parsing using Amazon Nova Pro.

---

## 📄 Resume Parsing

### Supported Formats
- **PDF only** - Currently, only PDF files are supported for resume uploads
- **File size limit:** 5MB maximum
- **Processing:** Background processing with status tracking (pending → processing → completed/failed)

### Technology Stack
- **Text Extraction:** PdfPig library (open-source .NET PDF parser)
- **AI Structuring:** AWS Bedrock with Amazon Nova Pro model
- **Storage:** AWS S3 for resume files

### Configuration
Resume parsing is configured in `appsettings.json`:

```json
{
  "ResumeParsing": {
    "BedrockModelId": "amazon.nova-pro-v1:0",
    "MaxFileSizeBytes": 5242880,
    "ParsingTimeoutSeconds": 30,
    "SupportedFormats": ["pdf"],
    "EnableBackgroundProcessing": true,
    "PollingIntervalSeconds": 10,
    "MaxConcurrentProcessing": 3
  }
}
```

### How It Works
1. User uploads PDF resume via API
2. File stored in S3 with status "pending"
3. Background service downloads PDF from S3
4. PdfPig extracts text from PDF
5. Text sent to Bedrock Nova Pro for structuring
6. Structured data stored in database with status "completed"

### Error Handling
The system provides user-friendly error messages for common issues:
- **Corrupted/encrypted PDFs:** "The PDF file appears to be corrupted or password-protected"
- **File too large:** "The file is too large. Please upload a PDF file smaller than 5MB"
- **Service unavailable:** "Resume parsing service is temporarily unavailable"
- **Unsupported format:** "Only PDF files are currently supported"

### Required AWS Permissions
- `bedrock:InvokeModel` - For Amazon Nova Pro
- `s3:GetObject` - For downloading resumes from S3
- `s3:PutObject` - For uploading resumes to S3

**Note:** Textract is no longer required or used.

---

## 💻 Local Development

### Backend
```bash
cd HireThemNoW.Server
dotnet restore
dotnet run  # Runs at http://localhost:5219
```

### Frontend
```bash
cd hirethemnow.client
npm install
npm run dev  # Runs at http://localhost:5173
```

---

## 🚀 AWS Deployment

### Automated Deployment Scripts

#### `deploy-backend.ps1`
✅ .NET 8 build & IIS packaging
✅ Elastic Beanstalk deployment
✅ **Auto-detects database** (uses `postgres` if no initial DB)
✅ **Auto-configures security groups** (EB → RDS)
✅ **Interactive HTTPS setup** with SSL validation

```powershell
.\deploy-backend.ps1
```

**Prompts:**
1. "Have you created the RDS database?" (Y/N)
   - Detects database name automatically
   - Configures security groups
2. "Configure HTTPS with SSL certificate?" (Y/N)
   - Lists available certificates
   - Validates certificate covers `api.hirethemnow.xyz`
   - Configures load balancer

**Time:** First deploy ~10min, updates ~3min

**URLs:**
- Direct: `http://hirethemnow-prod.eba-km2y4gpp.us-east-1.elasticbeanstalk.com`
- Custom: `https://api.hirethemnow.xyz`

#### `deploy-frontend.ps1`
✅ React/Vite production build
✅ S3 bucket & static hosting
✅ CloudFront CDN
✅ **Auto cache invalidation**

```powershell
.\deploy-frontend.ps1
```

**Time:** ~3min

**URLs:**
- S3: `http://hirethemnow-frontend.s3-website-us-east-1.amazonaws.com`
- Custom: `https://hirethemnow.xyz`

---

### Database Setup

**Option 1: Let deployment script handle it** (Recommended)
- Script detects if RDS exists
- Uses `postgres` database if no initial DB
- Configures security groups automatically

**Option 2: Manual RDS creation**
```powershell
aws rds create-db-instance `
    --db-instance-identifier hirethemnow-db `
    --db-instance-class db.t3.micro `
    --engine postgres `
    --engine-version 17.4 `
    --master-username postgres `
    --master-user-password YOUR_PASSWORD `
    --allocated-storage 20 `
    --region us-east-1
```

**Key Point:** PostgreSQL 17.4 works perfectly with Npgsql 9.0.4 (included in project)

---

### SSL Certificate

**Automated via deployment script:**
1. Script lists existing certificates
2. Validates certificate covers `api.hirethemnow.xyz`
3. Configures HTTPS listener

**Manual request:**
```powershell
aws acm request-certificate `
  --domain-name hirethemnow.xyz `
  --subject-alternative-names "*.hirethemnow.xyz" "api.hirethemnow.xyz" "www.hirethemnow.xyz" `
  --validation-method DNS `
  --region us-east-1
```

Add DNS CNAME records from ACM console to validate (5-30min).

---

## 🌐 Custom Domain Setup

### DNS Records (at your domain registrar)

| Type | Name | Value |
|------|------|-------|
| CNAME | `api` | `awseb-e-x-awsebloa-x91qpl92x8fi-1030568985.us-east-1.elb.amazonaws.com` |
| CNAME | `www` | `<cloudfront-distribution>.cloudfront.net` |
| CNAME | `_validation` | (from ACM certificate) |

**Example for GoDaddy:**
```
Type: CNAME
Name: api
Value: awseb-e-x-awsebloa-x91qpl92x8fi-1030568985.us-east-1.elb.amazonaws.com
TTL: 3600
```

### Verify DNS
```powershell
nslookup api.hirethemnow.xyz
nslookup www.hirethemnow.xyz
```

---

## 🔧 Troubleshooting

**⚠️ Note:** Deployment scripts (`deploy-backend.ps1`, `deploy-frontend.ps1`) automatically handle most issues. This guide is for **manual fixes** when automation fails.

---

### Health Checks

```powershell
# Check backend status
curl https://api.hirethemnow.xyz/api/health

# Check Elastic Beanstalk environment
aws elasticbeanstalk describe-environments --environment-names hirethemnow-prod --region us-east-1

# View recent errors
aws elasticbeanstalk describe-events --environment-name hirethemnow-prod --region us-east-1 --max-items 20

# Check frontend
curl https://hirethemnow.xyz
```

---

### Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| "Network timeout" | Wrong DATABASE_NAME | Use `postgres` if no initial DB |
| "SEC_E_WRONG_PRINCIPAL" | Cert doesn't cover API subdomain | Request cert with `*.hirethemnow.xyz` |
| "Could not find file" | Missing deployment manifest | Run `deploy-backend.ps1` |
| "Command hooks failed" | `.ebextensions` exists | Remove `.ebextensions` folder |
| 404 errors | App needs restart | Run restart command below |

---

### Database Issues

#### Manual Database Configuration

If deployment script didn't configure database:

```powershell
# Get RDS endpoint
$DB_ENDPOINT = aws rds describe-db-instances --db-instance-identifier hirethemnow-db --region us-east-1 --query "DBInstances[0].Endpoint.Address" --output text

# Check if DB has initial database name
$DB_NAME = aws rds describe-db-instances --db-instance-identifier hirethemnow-db --region us-east-1 --query "DBInstances[0].DBName" --output text

# If output is "None", use "postgres"
if ($DB_NAME -eq "None") { $DB_NAME = "postgres" }

# Update environment
aws elasticbeanstalk update-environment `
  --environment-name hirethemnow-prod `
  --region us-east-1 `
  --option-settings `
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DATABASE_HOST,Value=$DB_ENDPOINT `
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DATABASE_NAME,Value=$DB_NAME `
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DATABASE_USER,Value=postgres `
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DATABASE_PASSWORD,Value=YOUR_PASSWORD
```

#### Manual Security Group Configuration

If RDS can't connect to Elastic Beanstalk:

```powershell
# Get security groups
$RDS_SG = aws rds describe-db-instances --db-instance-identifier hirethemnow-db --region us-east-1 --query "DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId" --output text

$EB_SG = aws ec2 describe-security-groups --region us-east-1 --filters "Name=group-name,Values=awseb-e-*" --query "SecurityGroups[0].GroupId" --output text

# Add ingress rule
aws ec2 authorize-security-group-ingress --group-id $RDS_SG --protocol tcp --port 5432 --source-group $EB_SG --region us-east-1
```

---

### HTTPS/SSL Issues

#### Manual HTTPS Configuration

If deployment script didn't configure HTTPS:

```powershell
# List certificates
aws acm list-certificates --region us-east-1

# Check certificate domains
aws acm describe-certificate --certificate-arn YOUR_CERT_ARN --region us-east-1 --query "Certificate.SubjectAlternativeNames"

# Must include: api.hirethemnow.xyz or *.hirethemnow.xyz

# Configure HTTPS listener
aws elasticbeanstalk update-environment `
  --environment-name hirethemnow-prod `
  --region us-east-1 `
  --option-settings `
    Namespace=aws:elb:listener:443,OptionName=ListenerProtocol,Value=HTTPS `
    Namespace=aws:elb:listener:443,OptionName=InstancePort,Value=80 `
    Namespace=aws:elb:listener:443,OptionName=InstanceProtocol,Value=HTTP `
    Namespace=aws:elb:listener:443,OptionName=SSLCertificateId,Value=YOUR_CERT_ARN
```

#### Request New Certificate

If certificate doesn't cover API subdomain:

```powershell
aws acm request-certificate `
  --domain-name hirethemnow.xyz `
  --subject-alternative-names "*.hirethemnow.xyz" "api.hirethemnow.xyz" "www.hirethemnow.xyz" `
  --validation-method DNS `
  --region us-east-1
```

Add DNS CNAME records from output to validate (5-30 minutes).

---

### Deployment Failures

#### 404 Errors or App Not Responding

```powershell
# Restart application
aws elasticbeanstalk restart-app-server --environment-name hirethemnow-prod --region us-east-1
```

#### View Detailed Logs

```powershell
# Request logs
aws elasticbeanstalk request-environment-info --environment-name hirethemnow-prod --info-type tail --region us-east-1

# Wait 10 seconds, then retrieve
Start-Sleep -Seconds 10
aws elasticbeanstalk retrieve-environment-info --environment-name hirethemnow-prod --info-type tail --region us-east-1
```

---

### DNS Issues

#### Verify DNS Configuration

```powershell
nslookup api.hirethemnow.xyz
nslookup www.hirethemnow.xyz
```

**Required CNAME records at your domain registrar:**
- `api` → `awseb-e-x-awsebloa-x91qpl92x8fi-1030568985.us-east-1.elb.amazonaws.com`
- `www` → `your-cloudfront-distribution.cloudfront.net`

**DNS propagation:** May take 5 minutes to 48 hours depending on TTL

---

### Need More Help?

1. **Check deployment script output** - Shows exactly what it's doing
2. **View CloudWatch Logs** - AWS Console → CloudWatch → Log Groups → `/aws/elasticbeanstalk/hirethemnow-prod`
3. **Check Elastic Beanstalk Events** - AWS Console → Elastic Beanstalk → Environments → Events tab

**💡 Tip:** Re-run `deploy-backend.ps1` - it's idempotent and will fix most issues automatically

---

## 💰 Monthly Cost Estimates

### Free Tier (First 12 months)
- EC2: 750 hours/month t3.micro
- RDS: 750 hours/month db.t3.micro
- S3: 5GB storage
- CloudFront: 50GB transfer

### Development (~$25/month)
- Elastic Beanstalk (t3.micro): ~$8
- RDS (db.t3.micro): ~$15
- S3 + CloudFront: ~$2

### Production (~$62/month)
- Elastic Beanstalk (t3.small): ~$17
- RDS (db.t3.small): ~$30
- S3 + CloudFront: ~$15

---

## 🔐 Environment Variables

### .env.deploy (Required)
```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
JWT_SECRET=your_random_32char_string
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
DATABASE_PASSWORD=your_secure_password
AWS__S3__BucketName=hirethemnow-resumes
```

### Auto-Configured
Deployment scripts automatically set:
- `DATABASE_HOST` - RDS endpoint
- `DATABASE_NAME` - `postgres` (auto-detected)
- `DATABASE_USER` - `postgres`

---

## 📚 Architecture

### Backend
- **Platform:** Windows Server 2022 + IIS 10.0
- **Runtime:** .NET 8 + ASP.NET Core
- **Database:** PostgreSQL 17.4 (RDS)
- **Storage:** AWS S3 (resumes)
- **Auth:** JWT + Google OAuth
- **AI/ML:** AWS Bedrock (Amazon Nova Pro for resume structuring)
- **PDF Processing:** PdfPig library for text extraction

### Frontend
- **Framework:** React 18 + Vite
- **Hosting:** S3 + CloudFront
- **SSL:** AWS Certificate Manager

### Infrastructure
- **Load Balancer:** Classic ELB (HTTPS on port 443)
- **CDN:** CloudFront
- **DNS:** Custom domain with CNAME records

---

## ✨ Features

- 📝 Resume upload & parsing (PDF only, max 5MB)
- 🤖 AI-powered resume analysis (AWS Bedrock Nova Pro)
- 🎯 ATS score calculation
- 📊 Application tracking
- 🔐 Google OAuth authentication
- 💼 Job posting management
- 📧 Email notifications
- ☁️ Cloud storage (S3)

---

## 🤖 Job Scraping Automation (n8n Workflow)

### Overview
Automated job scraping workflow using n8n that searches LinkedIn job postings, extracts email addresses, and feeds job data into the HireThemNoW platform.

### Workflow Features
- **🔍 Google Search Integration** - Searches LinkedIn job postings with custom queries
- **🧠 AI-Powered Parsing** - Uses OpenAI GPT models to extract structured job data
- **📧 Email Extraction** - Identifies recruiter and company email addresses
- **📊 Bulk Processing** - Processes multiple job postings in batches
- **🔄 Automated Scheduling** - Runs every 3 hours automatically
- **📈 Dynamic Query Generation** - AI generates new search queries for different industries

### n8n Workflow Configuration

```json
{"nodes": [{"parameters": {"rule": {"interval": [{"field": "hours","hoursInterval": 3}]}},"type": "n8n-nodes-base.scheduleTrigger","typeVersion": 1.2,"position": [-1536,176],"id": "db37e857-89d0-4c50-b511-0c3ec9d1f953","name": "Schedule Trigger"},{"parameters": {"assignments": {"assignments": [{"id": "cc27b2d9-8de7-43ca-a741-2d150084f78e","name": "currentStartIndex","value": 1,"type": "number"},{"id": "fc552c57-4510-4f04-aa09-2294306d0d9f","name": "maxPages","value": 10,"type": "number"},{"id": "search-query","name": "searchQuery","value": "={{ $json.message.content }}","type": "string"}]},"options": {}},"type": "n8n-nodes-base.set","typeVersion": 3.4,"position": [-704,176],"id": "9707f128-6833-4b51-a05f-3604bb24ed90","name": "Set Initial Parameters"},{"parameters": {"url": "https://www.googleapis.com/customsearch/v1","sendQuery": true,"queryParameters": {"parameters": [{"name": "key","value": "AIzaSyCjxeBjBqTM0uWGFJWGWinQsezsUwCNcik"},{"name": "cx","value": "046d2d81437e54f14"},{"name": "q","value": "={{ $node[\"Set Initial Parameters\"].json.searchQuery }}"},{"name": "start","value": "={{ $runIndex == 0 ? $node[\"Set Initial Parameters\"].json.currentStartIndex : $node[\"Pagination Check\"].json.nextStartIndex }}"},{"name": "num","value": "10"}]},"options": {}},"type": "n8n-nodes-base.httpRequest","typeVersion": 4.2,"position": [-528,176],"id": "5eee9f87-70e3-4f12-8187-041d551d3e88","name": "Search Google"},{"parameters": {"model": {"__rl": true,"mode": "list","value": "gpt-4.1-mini"},"options": {}},"type": "@n8n/n8n-nodes-langchain.lmChatOpenAi","typeVersion": 1.2,"position": [-272,192],"id": "bab1a1a5-a6c6-4359-a549-f7fedee6964b","name": "OpenAI Chat Model","credentials": {"openAiApi": {"id": "NJpBSeyvriig4Dzu","name": "OpenAi account"}}},{"parameters": {"jsCode": "// Parse the OpenAI response\nconst input = $input.first().json;\nlet parsedData;\n\ntry {\n  // The response from OpenAI node in n8n typically comes as a text field\n  if (typeof input.text === 'string') {\n    parsedData = JSON.parse(input.text);\n  } else if (typeof input.response === 'string') {\n    parsedData = JSON.parse(input.response);\n  } else if (typeof input === 'string') {\n    parsedData = JSON.parse(input);\n  } else if (input.message?.content) {\n    // Sometimes it's in message.content\n    parsedData = typeof input.message.content === 'string' \n      ? JSON.parse(input.message.content) \n      : input.message.content;\n  } else if (input.jobs) {\n    // It might already be parsed\n    parsedData = input;\n  } else {\n    // Try to find any string field that looks like JSON\n    const jsonString = Object.values(input).find(val => \n      typeof val === 'string' && val.includes('\"jobs\"')\n    );\n    if (jsonString) {\n      parsedData = JSON.parse(jsonString);\n    } else {\n      throw new Error('Could not find JSON data in response');\n    }\n  }\n  \n  console.log('Successfully parsed data with', parsedData.jobs?.length, 'jobs');\n  \n} catch (error) {\n  console.error('Error parsing OpenAI response:', error);\n  console.log('Raw input:', JSON.stringify(input, null, 2));\n  \n  // Return error with debug info\n  return [{\n    json: {\n      error: 'Failed to parse OpenAI response',\n      errorMessage: error.message,\n      rawResponse: input,\n      debugInfo: 'Check the console logs for the raw response structure'\n    }\n  }];\n}\n\n// Extract jobs and pagination info\nconst jobs = parsedData.jobs || [];\nconst pagination = parsedData.pagination || { hasMore: false, nextStartIndex: 1 };\n\n// Filter for jobs with emails only\nconst jobsWithEmails = jobs.filter(job => job.hasEmail === true);\n\nconsole.log(`Found ${jobsWithEmails.length} jobs with emails out of ${jobs.length} total`);\n\n// Prepare bulk array for webhook\nconst bulkJobsArray = jobsWithEmails.map(job => ({\n  jobTitle: job.jobTitle || 'N/A',\n  company: job.company || 'N/A',\n  location: job.location || 'N/A',\n  emails: Array.isArray(job.emails) ? job.emails.join(', ') : (job.emails || 'No email'),\n  emailType: job.emailType || 'recruiter',\n  isRemote: job.isRemote || false,\n  salary: job.salary || 'Not specified',\n  link: job.link || '',\n  snippet: (job.snippet || '').substring(0, 200),\n  scrapedDate: job.scrapedDate || new Date().toISOString(),\n  secretToken: '046801ecc26b566bb35515f48bfb775ef2d909ca2e78e667613b4cdcf65fc831'\n}));\n\n// If no results with emails, return a message\nif (bulkJobsArray.length === 0) {\n  console.log('No jobs with emails found in this batch');\n  return [{\n    json: {\n      message: 'No jobs with emails found in this batch',\n      totalJobs: jobs.length,\n      jobsWithEmails: 0,\n      pagination: pagination\n    }\n  }];\n}\n\nconsole.log(`Prepared ${bulkJobsArray.length} jobs for bulk webhook submission`);\n\n// Return the bulk jobs wrapped in an object for n8n compatibility\n// The HTTP Request node will then send this as the request body\nreturn [{\n  json: {\n    jobs: bulkJobsArray,\n    metadata: {\n      totalProcessed: jobs.length,\n      jobsWithEmails: bulkJobsArray.length,\n      processedAt: new Date().toISOString(),\n      pagination: pagination\n    }\n  }\n}];\n"},"type": "n8n-nodes-base.code","typeVersion": 2,"position": [-48,176],"id": "6ad7693b-b614-4051-8d5c-2d6ac6642bbf","name": "Format Results"},{"parameters": {"promptType": "define","text": "={{ $json }}","messages": {"messageValues": [{"message": "You are an expert data parser for LinkedIn job postings. Extract structured information from Google search results of LinkedIn jobs.\\n\\nYour task is to:\\n1. Parse each search result item\\n2. Extract ALL email addresses found\\n3. Identify job details\\n4. Return structured JSON data\\n\\nRules:\\n- Extract emails from both title and snippet\\n- Identify company names accurately\\n- Determine if job is remote\\n- Extract salary information if present\\n- Categorize email types (personal/company/recruiter)\\n\\nReturn ONLY valid JSON in this exact format:\\n{\\n  \\\"jobs\\\": [\\n    {\\n      \\\"jobTitle\\\": \\\"string\\\",\\n      \\\"company\\\": \\\"string\\\",\\n      \\\"location\\\": \\\"string\\\",\\n      \\\"emails\\\": [\\\"email1@example.com\\\"],\\n      \\\"emailType\\\": \\\"personal|company|recruiter\\\",\\n      \\\"isRemote\\\": boolean,\\n      \\\"salary\\\": \\\"string or null\\\",\\n      \\\"link\\\": \\\"string\\\",\\n      \\\"snippet\\\": \\\"string (max 200 chars)\\\",\\n      \\\"hasEmail\\\": boolean\\n    }\\n  ],\\n  \\\"summary\\\": {\\n    \\\"totalResults\\\": number,\\n    \\\"resultsWithEmails\\\": number,\\n    \\\"emailBreakdown\\\": {\\n      \\\"personal\\\": number,\\n      \\\"company\\\": number,\\n      \\\"recruiter\\\": number\\n    }\\n  },\\n  \\\"pagination\\\": {\\n    \\\"hasMore\\\": boolean,\\n    \\\"nextStartIndex\\\": number\\n  }\\n}"},{"type": "HumanMessagePromptTemplate","message": "=Parse these LinkedIn job search results and extract all relevant information, especially email addresses:\\n\\n{{ JSON.stringify($json, null, 2) }}"}]},"batching": {}},"type": "@n8n/n8n-nodes-langchain.chainLlm","typeVersion": 1.7,"position": [-368,16],"id": "e2590ed5-342f-4917-a869-f3732ba8b6ee","name": "Result Parser"},{"parameters": {"method": "POST","url": "https://api.hirethemnow.xyz/api/jobwebhook/bulk","sendBody": true,"specifyBody": "json","jsonBody": "={{ $json }}","options": {}},"type": "n8n-nodes-base.httpRequest","typeVersion": 4.2,"position": [144,176],"id": "2a05bdd2-edfb-4afe-a6f6-b7186b6145ac","name": "HTTP Request"},{"parameters": {"operation": "append","documentId": {"__rl": true,"value": "1GYf6HmdJVRBeo5ell9c_fHFcZJiBZby8OtwXfPtpDSM","mode": "list","cachedResultName": "Search Queries","cachedResultUrl": "https://docs.google.com/spreadsheets/d/1GYf6HmdJVRBeo5ell9c_fHFcZJiBZby8OtwXfPtpDSM/edit?usp=drivesdk"},"sheetName": {"__rl": true,"value": "gid=0","mode": "list","cachedResultName": "Sheet1","cachedResultUrl": "https://docs.google.com/spreadsheets/d/1GYf6HmdJVRBeo5ell9c_fHFcZJiBZby8OtwXfPtpDSM/edit#gid=0"},"columns": {"mappingMode": "defineBelow","value": {"searchQuery": "={{ $item(\"0\").$node[\"Set Initial Parameters\"].json[\"searchQuery\"] }}"},"matchingColumns": ["searchQuery"],"schema": [{"id": "searchQuery","displayName": "searchQuery","required": false,"defaultMatch": false,"display": true,"type": "string","canBeUsedToMatch": true,"removed": false}],"attemptToConvertTypes": false,"convertFieldsToString": false},"options": {}},"type": "n8n-nodes-base.googleSheets","typeVersion": 4.7,"position": [384,176],"id": "55618147-f75a-45c8-ab6b-1275bf53fa51","name": "Append row in sheet","credentials": {"googleSheetsOAuth2Api": {"id": "T3qCmXnzRqMIuzug","name": "Google Sheets account"}}},{"parameters": {"modelId": {"__rl": true,"value": "gpt-3.5-turbo","mode": "list","cachedResultName": "GPT-3.5-TURBO"},"messages": {"values": [{"content": "=Generate ONE new LinkedIn search query based on {{ $json.searchQuery }}. \n\nRules:\n- Do NOT change the \"site:\" portion of the query.\n- Keep the pattern and structure consistent.\n- Replace or append only the job title and optionally add a location or industry.\n- Ensure the new query introduces a different job role from a different industry or sector (e.g., healthcare, education, finance, tech, manufacturing, hospitality, etc.).\n- Only return ONE complete query as plain text (no explanations, no list)."}]},"options": {}},"type": "@n8n/n8n-nodes-langchain.openAi","typeVersion": 1.8,"position": [-992,176],"id": "dba40fac-0ec3-4cfb-9ef0-bd8e43d8ae8e","name": "Message a model","credentials": {"openAiApi": {"id": "NJpBSeyvriig4Dzu","name": "OpenAi account"}}},{"parameters": {"documentId": {"__rl": true,"value": "1GYf6HmdJVRBeo5ell9c_fHFcZJiBZby8OtwXfPtpDSM","mode": "list","cachedResultName": "Search Queries","cachedResultUrl": "https://docs.google.com/spreadsheets/d/1GYf6HmdJVRBeo5ell9c_fHFcZJiBZby8OtwXfPtpDSM/edit?usp=drivesdk"},"sheetName": {"__rl": true,"value": "gid=0","mode": "list","cachedResultName": "Sheet1","cachedResultUrl": "https://docs.google.com/spreadsheets/d/1GYf6HmdJVRBeo5ell9c_fHFcZJiBZby8OtwXfPtpDSM/edit#gid=0"},"options": {}},"type": "n8n-nodes-base.googleSheets","typeVersion": 4.7,"position": [-1216,176],"id": "b624181b-3d8b-46e4-bbae-5399db9cd300","name": "Get row(s) in sheet","credentials": {"googleSheetsOAuth2Api": {"id": "T3qCmXnzRqMIuzug","name": "Google Sheets account"}}}],"connections": {"Schedule Trigger": {"main": [[{"node": "Get row(s) in sheet","type": "main","index": 0}]]},"Set Initial Parameters": {"main": [[{"node": "Search Google","type": "main","index": 0}]]},"Search Google": {"main": [[{"node": "Result Parser","type": "main","index": 0}]]},"OpenAI Chat Model": {"ai_languageModel": [[{"node": "Result Parser","type": "ai_languageModel","index": 0}]]},"Format Results": {"main": [[{"node": "HTTP Request","type": "main","index": 0}]]},"Result Parser": {"main": [[{"node": "Format Results","type": "main","index": 0}]]},"HTTP Request": {"main": [[{"node": "Append row in sheet","type": "main","index": 0}]]},"Append row in sheet": {"main": [[]]},"Message a model": {"main": [[{"node": "Set Initial Parameters","type": "main","index": 0}]]},"Get row(s) in sheet": {"main": [[{"node": "Message a model","type": "main","index": 0}]]}},"pinData": {},"meta": {"templateCredsSetupCompleted": true,"instanceId": "642a0f769fbecc4c8752269569cd4ae7f0b5aa5b02d601f8e04d4b708cb4740d"}}
```

### Setup Requirements

#### Prerequisites
- **n8n Instance** - Self-hosted or cloud n8n installation
- **Google Custom Search API** - For LinkedIn job search
- **OpenAI API** - For AI-powered job data parsing
- **Google Sheets API** - For query management and logging

#### Required Credentials
1. **OpenAI API Key** - Configure in n8n credentials
2. **Google Custom Search API Key** - `AIzaSyCjxeBjBqTM0uWGFJWGWinQsezsUwCNcik`
3. **Google Search Engine ID** - `046d2d81437e54f14`
4. **Google Sheets OAuth** - For search query management

#### API Endpoint Configuration
The workflow sends processed job data to:
```
POST https://api.hirethemnow.xyz/api/jobwebhook/bulk
```

**Required Headers:**
- `Content-Type: application/json`
- `secretToken: 046801ecc26b566bb35515f48bfb775ef2d909ca2e78e667613b4cdcf65fc831`

### Workflow Process

1. **⏰ Schedule Trigger** - Runs every 3 hours automatically
2. **� Get PSheet Data** - Retrieves existing search queries from Google Sheets
3. **🤖 Generate Query** - AI creates new search query based on existing data (single new item focus)
4. **🔧 Set Parameters** - Initializes search parameters with AI-generated query
5. **� FGoogle Search** - Searches LinkedIn jobs using Custom Search API
6. **🤖 AI Parser** - Uses OpenAI to extract structured job data and emails
7. **📊 Format Results** - Processes and filters jobs with email addresses
8. **📤 Bulk Submit** - Sends job data to HireThemNoW API endpoint
9. **📝 Log Query** - Appends new search query to Google Sheets for future reference

### Data Structure

**Input to API:**
```json
{
  "jobs": [
    {
      "jobTitle": "Software Engineer",
      "company": "Tech Corp",
      "location": "San Francisco, CA",
      "emails": "recruiter@techcorp.com",
      "emailType": "company",
      "isRemote": true,
      "salary": "$120k-150k",
      "link": "https://linkedin.com/jobs/view/123456",
      "snippet": "Join our team as a Software Engineer...",
      "scrapedDate": "2024-01-15T10:30:00Z",
      "secretToken": "046801ecc26b566bb35515f48bfb775ef2d909ca2e78e667613b4cdcf65fc831"
    }
  ],
  "metadata": {
    "totalProcessed": 10,
    "jobsWithEmails": 3,
    "processedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Installation

1. **Import Workflow** - Copy the JSON configuration above into n8n
2. **Configure Credentials** - Set up OpenAI, Google APIs, and Google Sheets access
3. **Update API Keys** - Replace placeholder API keys with your actual keys
4. **Test Workflow** - Run manually to verify all connections work
5. **Activate Schedule** - Enable the 3-hour schedule trigger

### Monitoring

- **Google Sheets Integration** - Tracks search queries and generates new ones
- **Error Handling** - Built-in error logging and debugging
- **Rate Limiting** - Respects API rate limits with wait nodes
- **Bulk Processing** - Efficiently processes multiple jobs per API call

**⚠️ Note:** Ensure your HireThemNoW API endpoint `/api/jobwebhook/bulk` is configured to accept and process the bulk job data format.

---

## 🆘 Support

**Deployment Issues:**
1. Check [Troubleshooting](#-troubleshooting) section above
2. View logs: `aws elasticbeanstalk describe-events --environment-name hirethemnow-prod --region us-east-1`
3. Check CloudWatch Logs in AWS Console

---

## 📄 License

MIT License - See LICENSE file

---

**Built with:** ASP.NET Core 8 • React 18 • PostgreSQL 17 • AWS

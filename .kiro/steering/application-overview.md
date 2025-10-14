# HireThemNow Application Overview

## What is HireThemNow?

HireThemNow is a modern job application tracking and resume analysis platform with AI-powered resume parsing and ATS (Applicant Tracking System) scoring capabilities. The platform helps job seekers optimize their resumes and track their job applications.

## Technology Stack

### Backend
- **Framework**: ASP.NET Core 8 (C#)
- **Runtime**: .NET 8
- **Database**: PostgreSQL 17.4
- **ORM**: Entity Framework Core with Npgsql
- **Authentication**: JWT + Google OAuth
- **Hosting**: AWS Elastic Beanstalk (Windows Server 2022 + IIS 10.0)

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Hosting**: AWS S3 + CloudFront CDN

### AWS Services
- **S3**: File storage (resumes, profile pictures)
- **Bedrock**: AI-powered resume parsing using Amazon Nova Pro model
- **RDS**: PostgreSQL database hosting
- **SES**: Email notifications
- **CloudFront**: CDN for frontend
- **Elastic Beanstalk**: Backend application hosting
- **ACM**: SSL certificate management

### PDF Processing
- **PdfPig**: Open-source .NET library for PDF text extraction
- **No AWS Textract**: The application uses PdfPig for text extraction, not AWS Textract

## Key Features

1. **Resume Upload & Two-Phase Processing** (PDF only, max 5MB)
   - Automatic text extraction using PdfPig library
   - AI-powered structuring via AWS Bedrock Nova Pro
   - Sequential parsing → analysis workflow with automatic transitions

2. **Comprehensive ATS Analysis & Scoring** (AWS Bedrock Nova Pro)
   - **Overall ATS Score**: Weighted composite score (0-100)
   - **Detailed Scoring Breakdown**:
     - Formatting Score (20% weight): Layout, structure, readability
     - Keywords Score (25% weight): Industry-relevant keyword density
     - Experience Score (20% weight): Work history presentation and achievements
     - Education Score (10% weight): Educational background and credentials
     - Skills Score (15% weight): Technical and soft skills presentation
     - Achievements Score (10% weight): Quantifiable accomplishments
   - **Actionable Recommendations**: Specific suggestions for resume improvement
   - **Keyword Analysis**: Found vs missing industry-specific keywords
   - **Section-by-Section Feedback**: Detailed analysis of each resume section
   - **Readability Assessment**: Sentence structure and clarity evaluation

3. **Analysis Retry & Error Recovery**
   - Manual retry functionality for failed analyses
   - Automatic error handling and status management
   - Clear error messages and troubleshooting guidance

4. **Application Tracking**
5. **Google OAuth Authentication**
6. **Job Posting Management**
7. **Email Notifications**
   - Resume parsing completion alerts
   - ATS analysis results with scores and recommendations
   - Trial period and subscription notifications
8. **Cloud Storage** (S3)
9. **Privacy Controls**
10. **Data Export**
11. **Trial Period Management** (7-day free trial)

## Architecture

### Service Architecture

The application follows a layered service architecture with clear separation of concerns:

**Core Services:**
- **IDataService / DatabaseDataService**: Database operations and user management
- **IS3Service / S3Service**: File storage and retrieval operations
- **IEmailService / EmailService**: Email notifications via AWS SES
- **IResumeParsingService / ResumeParsingService**: Resume text extraction and structuring (Phase 1)
- **IResumeAnalysisService / ResumeAnalysisService**: ATS analysis and scoring (Phase 2)
- **IBedrockAgentService / BedrockAgentService**: AWS Bedrock AI integration

**Background Services:**
- **ResumeParsingBackgroundService**: Dual-phase background worker that coordinates both resume parsing and analysis processing

**Service Dependencies:**
```
ResumeController → ResumeParsingService → S3Service, BedrockAgentService
ResumeAnalysisController → ResumeAnalysisService → BedrockAgentService
ResumeParsingBackgroundService → ResumeParsingService, ResumeAnalysisService
EmailService → AWS SES
All Services → DatabaseDataService → ApplicationDbContext
```

**Service Registration (Program.cs):**
```csharp
// Core services
builder.Services.AddScoped<IDataService, DatabaseDataService>();
builder.Services.AddScoped<IS3Service, S3Service>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IResumeParsingService, ResumeParsingService>();
builder.Services.AddScoped<IResumeAnalysisService, ResumeAnalysisService>();
builder.Services.AddScoped<IBedrockAgentService, BedrockAgentService>();

// Background services
builder.Services.AddHostedService<ResumeParsingBackgroundService>();
```

### Request Flow
1. User accesses frontend via CloudFront (https://hirethemnow.xyz)
2. Frontend makes API calls to backend via ALB (https://api.hirethemnow.xyz)
3. Backend processes requests, interacts with PostgreSQL database
4. File uploads go to S3
5. Resume processing uses two-phase architecture: parsing first, then analysis automatically
6. Background service coordinates both parsing and analysis phases asynchronously

### Authentication Flow
1. User logs in via Google OAuth or email/password
2. Backend validates credentials and generates JWT token
3. JWT token included in subsequent API requests
4. Backend validates JWT on protected endpoints

### Resume Processing Flow (Two-Phase Architecture)

The application implements a **sequential two-phase processing architecture** where parsing must complete before analysis begins:

**Complete Upload → Parse → Analyze → Notify Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│                        UPLOAD & INITIALIZATION                  │
└─────────────────────────────────────────────────────────────────┘
1. User uploads PDF resume via ResumeController
2. File stored in S3 with "pending" status
3. ResumeContent record created (status: pending)
4. ResumeAnalysis record created (status: waiting_for_parsing) ← AUTOMATIC LINKING
5. User receives upload confirmation

┌─────────────────────────────────────────────────────────────────┐
│                         PHASE 1: PARSING                       │
│                    (Priority Processing)                        │
└─────────────────────────────────────────────────────────────────┘
6. ResumeParsingBackgroundService polls for pending resumes
7. ResumeParsingService updates status to "processing"
8. PdfPig extracts plain text from PDF
9. Text sent to Bedrock Nova Pro (parsing configuration: temp=0.0, maxTokens=4096)
10. Bedrock returns structured JSON content
11. Structured data stored in ResumeContent with "completed" status
12. User notified via email about parsing completion
13. AUTOMATIC TRIGGER: Associated ResumeAnalysis becomes eligible for processing

┌─────────────────────────────────────────────────────────────────┐
│                        PHASE 2: ANALYSIS                       │
│                   (Dependent on Phase 1)                       │
└─────────────────────────────────────────────────────────────────┘
14. ResumeParsingBackgroundService polls for pending analyses
15. Dependency check: Verify ResumeContent status is "completed"
16. ResumeAnalysisService updates status to "processing"
17. Structured content retrieved from ResumeContent
18. Content sent to Bedrock Nova Pro (analysis configuration: temp=0.2, maxTokens=8192)
19. Bedrock returns detailed ATS analysis with scores and recommendations
20. Analysis results stored in ResumeAnalysis with "completed" status
21. User notified via email with ATS score and actionable recommendations
```

**Key Architecture Components:**

- **Sequential Dependency**: Phase 2 cannot begin until Phase 1 completes successfully
- **Automatic Transition**: No manual intervention required between phases
- **Priority Processing**: Background service prioritizes parsing over analysis
- **Dual Bedrock Configuration**: Separate optimized settings for parsing vs analysis
- **Error Isolation**: Parsing failures prevent analysis from proceeding
- **Status Coordination**: Analysis status reflects parsing progress automatically

## Project Structure

```
HireThemNow/
├── HireThemNoW.Server/          # Backend API
│   ├── Controllers/             # API endpoints
│   ├── Models/                  # Data models
│   ├── Services/                # Business logic
│   ├── Data/                    # Database context
│   └── Migrations/              # EF Core migrations
├── hirethemnow.client/          # Frontend React app
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── utils/               # Utility functions
│   │   └── App.tsx              # Main app component
│   └── public/                  # Static assets
├── HireThemNow.Test/            # Unit tests
└── .kiro/                       # Kiro configuration
    └── steering/                # Steering documentation
```

## Environment Configuration

### Required Environment Variables
- `JWT_SECRET`: Secret key for JWT token generation
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `DATABASE_HOST`: PostgreSQL host
- `DATABASE_NAME`: Database name
- `DATABASE_USER`: Database username
- `DATABASE_PASSWORD`: Database password
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `AWS_REGION`: AWS region (us-east-1)

### Configuration Files
- `appsettings.json`: Base configuration
- `appsettings.Development.json`: Development overrides
- `appsettings.Production.json`: Production overrides
- `.env.deploy`: Deployment credentials (gitignored)

## Deployment

### Backend Deployment
- Automated via `deploy-backend.ps1` PowerShell script
- Builds .NET application
- Creates IIS deployment package
- Deploys to Elastic Beanstalk
- Configures database connection
- Sets up HTTPS with SSL certificate

### Frontend Deployment
- Automated via `deploy-frontend.ps1` PowerShell script
- Builds React application with Vite
- Uploads to S3 bucket
- Configures CloudFront distribution
- Invalidates CloudFront cache

## Live URLs
- **Frontend**: https://hirethemnow.xyz
- **API**: https://api.hirethemnow.xyz
- **S3 Direct**: http://hirethemnow-frontend.s3-website-us-east-1.amazonaws.com
- **EB Direct**: http://hirethemnow-prod.eba-km2y4gpp.us-east-1.elasticbeanstalk.com

## Development Workflow

1. **Local Development**
   - Backend: `dotnet run` (runs on http://localhost:5219)
   - Frontend: `npm run dev` (runs on http://localhost:5173)

2. **Testing**
   - Unit tests in `HireThemNow.Test` project
   - Run with `dotnet test`

3. **Deployment**
   - Backend: `.\deploy-backend.ps1`
   - Frontend: `.\deploy-frontend.ps1`

## Security Considerations

- JWT tokens expire after 7 days
- Google OAuth for secure authentication
- HTTPS enforced on all endpoints
- CORS configured for specific origins
- S3 pre-signed URLs for secure file access
- Database credentials stored in environment variables
- Trial period enforcement
- Privacy controls for user data

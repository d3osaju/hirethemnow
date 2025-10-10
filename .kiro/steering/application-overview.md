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

1. **Resume Upload & Parsing** (PDF only, max 5MB)
2. **AI-Powered Resume Analysis** (AWS Bedrock Nova Pro)
3. **ATS Score Calculation**
4. **Application Tracking**
5. **Google OAuth Authentication**
6. **Job Posting Management**
7. **Email Notifications**
8. **Cloud Storage** (S3)
9. **Privacy Controls**
10. **Data Export**
11. **Trial Period Management** (7-day free trial)

## Architecture

### Request Flow
1. User accesses frontend via CloudFront (https://hirethemnow.xyz)
2. Frontend makes API calls to backend via ALB (https://api.hirethemnow.xyz)
3. Backend processes requests, interacts with PostgreSQL database
4. File uploads go to S3
5. Resume parsing uses PdfPig for text extraction, then Bedrock for AI structuring
6. Background service processes pending resumes asynchronously

### Authentication Flow
1. User logs in via Google OAuth or email/password
2. Backend validates credentials and generates JWT token
3. JWT token included in subsequent API requests
4. Backend validates JWT on protected endpoints

### Resume Parsing Flow
1. User uploads PDF resume
2. File stored in S3 with "pending" status
3. Background service polls for pending resumes
4. PdfPig extracts text from PDF
5. Text sent to Bedrock Nova Pro for structuring
6. Structured data stored in database with "completed" status
7. User notified via email

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

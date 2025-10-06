# Product Overview

HireThemNoW is a modern job application tracking and resume analysis platform with AI-powered resume analysis capabilities.

## Core Features

- **Resume upload and parsing** - Fast upload with background processing (PDF only, max 5MB)
- **AI-powered resume analysis** - Using AWS Bedrock (Amazon Nova Pro) for intelligent parsing
- **Background processing** - Asynchronous resume parsing for better performance
- **ATS (Applicant Tracking System) score calculation** - Automated scoring
- **Application tracking and management** - Track all job applications
- **Job posting management** - Manage job listings
- **Google OAuth authentication** - Secure login with JWT tokens
- **Email notifications** - Via AWS SES with user preferences
- **Cloud storage** - Resumes and profile pictures stored in AWS S3
- **User trial system** - 7-day trial period for new users
- **Industry and skill tracking** - Structured skill expertise and industry categorization
- **Release notes** - In-app release notes and updates
- **Profile management** - User profile pictures and preferences

## Resume Processing Architecture

### Supported Formats
- **PDF only** - Currently only PDF files are supported
- **File size limit:** 5MB maximum
- **Technology:** PdfPig library for text extraction, AWS Bedrock Nova Pro for structuring

### Upload Flow
1. User uploads resume via API
2. File stored in S3 (`hirethemnow-files/resumes/`)
3. Database record created with status "pending"
4. API returns immediately (fast response ~1 second)

### Background Processing
- Dedicated background service monitors database for pending resumes
- Downloads PDF from S3 and extracts text using PdfPig library
- Sends extracted text to AWS Bedrock (Amazon Nova Pro) for structuring
- Processes up to 3 resumes concurrently
- Polls every 10 seconds for new uploads
- Updates status: pending → processing → completed/failed
- Comprehensive error handling and retry logic

### Benefits
- **Fast uploads**: Users don't wait for parsing to complete
- **Reliable**: Failed parses can be retried without re-uploading
- **Scalable**: Multiple resumes processed simultaneously
- **Monitorable**: Clear status tracking in database
- **Simple architecture**: No Textract dependency, uses open-source PdfPig library

## Storage Structure

### S3 Bucket: `hirethemnow-files`
```
hirethemnow-files/
├── profile-pictures/     # User profile pictures
└── resumes/             # Resume files (triggers parsing)
    └── YYYY/MM/DD/      # Date-based organization
        └── {guid}_{filename}
```

## Live Deployment

- Frontend: https://hirethemnow.xyz
- API: https://api.hirethemnow.xyz

## Key Data Models

- **User** - User accounts with trial management, email preferences, and profile data
- **ResumeAnalysis** - Parsed resume data with status tracking (pending/processing/completed/failed)
- **StructuredResumeContent** - AI-extracted resume information (contact, experience, education, skills)
- **EmailPreference** - User email notification settings
- **Industry** - Industry categorization for job postings
- **SkillExpertise** - Skill tracking and expertise levels
- **ReleaseNote** - Application release notes and updates

## Target Users

Recruiters and hiring managers who need to track job applications and analyze candidate resumes efficiently.

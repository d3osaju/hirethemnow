# Product Overview

HireThemNoW is a modern job application tracking and resume analysis platform with AI-powered resume analysis capabilities.

## Core Features

- **Resume upload and parsing** - Fast upload with background processing
- **AI-powered resume analysis** - Using AWS Bedrock for intelligent parsing
- **Background processing** - Asynchronous resume parsing for better performance
- **ATS (Applicant Tracking System) score calculation** - Automated scoring
- **Application tracking and management** - Track all job applications
- **Job posting management** - Manage job listings
- **Google OAuth authentication** - Secure login
- **Email notifications** - Via AWS SES
- **Cloud storage** - Resumes and profile pictures stored in AWS S3

## Resume Processing Architecture

### Upload Flow
1. User uploads resume via API
2. File stored in S3 (`hirethemnow-files/resumes/`)
3. Database record created with status "pending"
4. API returns immediately (fast response ~1 second)

### Background Processing
- Dedicated background service monitors database for pending resumes
- Processes up to 3 resumes concurrently
- Polls every 10 seconds for new uploads
- Updates status: pending → processing → completed/failed
- Comprehensive error handling and retry logic

### Benefits
- **Fast uploads**: Users don't wait for parsing to complete
- **Reliable**: Failed parses can be retried without re-uploading
- **Scalable**: Multiple resumes processed simultaneously
- **Monitorable**: Clear status tracking in database

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

## Target Users

Recruiters and hiring managers who need to track job applications and analyze candidate resumes efficiently.

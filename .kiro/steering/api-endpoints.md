# API Endpoints Documentation

## Base URL

- **Production**: `https://api.hirethemnow.xyz`
- **Development**: `http://localhost:5219`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "errors": []
}
```

---

## Authentication Endpoints

### POST /api/auth/login
Email/password login.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-id",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "candidate",
      "picture": "https://...",
      "isCompleted": true
    },
    "token": "jwt-token"
  }
}
```

**Error Responses**:
- `401`: Trial expired
- `400`: Invalid credentials

---

### POST /api/auth/register
Create new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "candidate"
}
```

**Response**: Same as login

---

### POST /api/auth/google
Google OAuth authentication.

**Request Body**:
```json
{
  "token": "google-id-token"
}
```

**Response**: Same as login

**Notes**:
- Validates Google token with 10-minute clock tolerance
- Creates user if doesn't exist
- Updates profile picture from Google

---

### POST /api/auth/logout
Logout user (client-side token removal).

**Response**:
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### GET /api/auth/profile
Get current user profile.

**Auth**: Required

**Response**:
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "user-id",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "candidate",
    "picture": "https://...",
    "phone": "+1234567890",
    "location": "New York, NY",
    "bio": "Software engineer...",
    "skills": ["JavaScript", "React"],
    "title": "Software Engineer",
    "industry": "Technology",
    "experience": "5 years",
    "resumeUrl": "s3-key",
    "isCompleted": true,
    "trialStartDate": "2025-01-01T00:00:00Z",
    "trialEndDate": "2025-01-08T00:00:00Z",
    "isTrialActive": true,
    "hasSeenTrialEndMessage": false,
    "hasActiveSubscription": false,
    "hasAccess": true,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

### POST /api/auth/trial/acknowledge
Acknowledge trial end message.

**Auth**: Required

**Response**:
```json
{
  "success": true,
  "message": "Trial end message acknowledged"
}
```

---

## User Endpoints

### GET /api/users/profile
Get current user profile (same as /api/auth/profile).

**Auth**: Required

---

### PUT /api/users/profile
Update user profile.

**Auth**: Required

**Request Body** (all fields optional):
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "location": "New York, NY",
  "bio": "Software engineer...",
  "skills": ["JavaScript", "React"],
  "title": "Software Engineer",
  "industry": "Technology",
  "experience": "5 years",
  "resumeUrl": "s3-key",
  "picture": "s3-key-or-url",
  "isCompleted": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { /* updated user object */ }
}
```

---

### POST /api/users/profile/picture
Upload profile picture.

**Auth**: Required

**Request**: `multipart/form-data`
- `picture`: Image file (JPG, PNG, GIF, max 5MB)

**Response**:
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": "https://presigned-url"
}
```

**Validation**:
- Allowed types: `.jpg`, `.jpeg`, `.png`, `.gif`
- Max size: 5MB
- Deletes old profile picture from S3

---

### GET /api/users/{id}
Get public user profile by ID.

**Auth**: Required

**Response**: Limited user information (privacy-filtered)

---

### POST /api/users/onboarding/complete
Complete onboarding process.

**Auth**: Required

**Request Body**: Same as profile update

**Response**:
```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "data": { /* user object */ }
}
```

---

### DELETE /api/users/profile
Delete user account.

**Auth**: Required

**Request Body**:
```json
{
  "confirmation": "DELETE"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Profile deleted successfully"
}
```

**Notes**:
- Deletes all user data
- Removes S3 files (resume, profile picture)
- Cascades to related records

---

## Resume Endpoints

### POST /api/resume/upload
Upload resume file.

**Auth**: Required

**Request**: `multipart/form-data`
- `resume`: PDF file (max 5MB)

**Response**:
```json
{
  "success": true,
  "message": "Resume uploaded successfully! We're parsing your resume in the background.",
  "data": {
    "resumeUrl": "s3-key",
    "fileName": "resume.pdf",
    "status": "pending",
    "parsingStatus": "pending",
    "parsingId": 123,
    "analysisId": 456,
    "analysisStatus": "waiting_for_parsing"
  }
}
```

**Validation**:
- Allowed types: `.pdf`, `.doc`, `.docx`
- Max size: 5MB

**Process**:
1. Upload to S3
2. Update user's resumeUrl
3. Create ResumeContent record with status "pending"
4. Create ResumeAnalysis record with status "waiting_for_parsing"
5. Background service processes parsing first, then analysis automatically
6. User receives email notifications when parsing and analysis complete

---

### GET /api/resume/download
Download user's resume.

**Auth**: Required

**Response**: File stream (PDF)

**Error Responses**:
- `404`: No resume found

---

### GET /api/resume/status
Get resume upload status.

**Auth**: Required

**Response**:
```json
{
  "success": true,
  "message": "Resume found",
  "data": {
    "hasResume": true,
    "needsUpload": false,
    "status": "uploaded",
    "resumeUrl": "s3-key"
  }
}
```

---

### GET /api/resume/parsing-status
Get resume parsing status.

**Auth**: Required

**Response**:
```json
{
  "success": true,
  "message": "Parsing status retrieved successfully",
  "data": {
    "id": 123,
    "fileName": "resume.pdf",
    "status": "completed",
    "uploadedAt": "2025-01-01T00:00:00Z",
    "parsedAt": "2025-01-01T00:01:00Z",
    "error": null
  }
}
```

**Status Values**:
- `pending`: Waiting for processing
- `processing`: Currently being parsed
- `completed`: Successfully parsed (analysis will begin automatically)
- `failed`: Parsing failed

**Notes**:
- When parsing completes successfully, the associated ResumeAnalysis status automatically changes from "waiting_for_parsing" to "processing"
- Use `/api/resume/analysis/status` to check analysis progress after parsing completes

---

### GET /api/resume/content
Get parsed resume content.

**Auth**: Required

**Response** (if completed):
```json
{
  "success": true,
  "message": "Resume content retrieved successfully",
  "data": {
    "id": 123,
    "fileName": "resume.pdf",
    "contentType": "pdf",
    "parsedContent": "{ /* structured JSON */ }",
    "textContent": "Plain text...",
    "status": "completed",
    "uploadedAt": "2025-01-01T00:00:00Z",
    "parsedAt": "2025-01-01T00:01:00Z"
  }
}
```

**Response** (if processing):
```json
{
  "success": true,
  "message": "Your resume is being parsed. This usually takes a few seconds.",
  "data": {
    "status": "processing",
    "uploadedAt": "2025-01-01T00:00:00Z",
    "fileName": "resume.pdf"
  }
}
```

**Status Code**: `202` (Accepted) if still processing

---

### GET /api/resume/content/history
Get resume upload history.

**Auth**: Required

**Response**:
```json
{
  "success": true,
  "message": "Retrieved 3 resume version(s)",
  "data": [
    {
      "id": 123,
      "fileName": "resume.pdf",
      "contentType": "pdf",
      "status": "completed",
      "uploadedAt": "2025-01-01T00:00:00Z",
      "parsedAt": "2025-01-01T00:01:00Z",
      "fileSizeBytes": 1024000,
      "error": null
    }
  ]
}
```

---

## Resume Analysis Endpoints

### GET /api/resume/analysis/status
Get current resume analysis status.

**Auth**: Required

**Response** (waiting for parsing):
```json
{
  "success": true,
  "message": "Your resume is being parsed. Analysis will begin automatically once parsing is complete.",
  "data": {
    "status": "waiting_for_parsing",
    "message": "Your resume is being parsed. Analysis will begin automatically once parsing is complete.",
    "overallScore": null,
    "completedAt": null,
    "errorMessage": null
  }
}
```

**Response** (processing):
```json
{
  "success": true,
  "message": "Your resume is being analyzed for ATS compatibility. This usually takes 10-15 seconds.",
  "data": {
    "status": "processing",
    "message": "Your resume is being analyzed for ATS compatibility. This usually takes 10-15 seconds.",
    "overallScore": null,
    "completedAt": null,
    "errorMessage": null
  }
}
```

**Response** (completed):
```json
{
  "success": true,
  "message": "Analysis completed successfully",
  "data": {
    "status": "completed",
    "message": "Analysis completed successfully",
    "overallScore": 85,
    "completedAt": "2025-01-01T00:01:30Z",
    "errorMessage": null
  }
}
```

**Response** (failed):
```json
{
  "success": true,
  "message": "Analysis failed",
  "data": {
    "status": "failed",
    "message": "Analysis failed",
    "overallScore": null,
    "completedAt": null,
    "errorMessage": "Analysis service is temporarily unavailable. Please try again in a few minutes."
  }
}
```

**Status Codes**:
- `200`: Analysis completed or failed
- `202`: Analysis in progress (waiting_for_parsing or processing)
- `404`: No analysis found for user

**Status Values**:
- `waiting_for_parsing`: Resume is being parsed, analysis will start automatically
- `processing`: Analysis is currently running
- `completed`: Analysis finished successfully
- `failed`: Analysis failed with error

---

### GET /api/resume/analysis/results
Get detailed resume analysis results.

**Auth**: Required

**Response** (completed):
```json
{
  "success": true,
  "message": "Analysis results retrieved successfully",
  "data": {
    "id": 123,
    "userId": "user-id",
    "status": "completed",
    "atsOverallScore": 85,
    "atsFormattingScore": 90,
    "atsKeywordsScore": 80,
    "atsExperienceScore": 85,
    "atsEducationScore": 90,
    "atsSkillsScore": 85,
    "atsAchievementsScore": 80,
    "strengths": [
      "Strong technical skills clearly presented",
      "Quantifiable achievements in work experience",
      "Professional formatting and structure"
    ],
    "weaknesses": [
      "Missing industry-specific keywords",
      "Limited leadership experience mentioned",
      "Could benefit from more action verbs"
    ],
    "recommendations": [
      "Add more industry-specific keywords like 'Agile', 'Scrum', 'CI/CD'",
      "Quantify more achievements with specific numbers and percentages",
      "Use stronger action verbs like 'spearheaded', 'optimized', 'architected'",
      "Add a skills section with technical and soft skills",
      "Include relevant certifications if available"
    ],
    "keywordsFound": [
      "JavaScript",
      "React",
      "Node.js",
      "MongoDB",
      "Git"
    ],
    "keywordsMissing": [
      "TypeScript",
      "AWS",
      "Docker",
      "Kubernetes",
      "Agile"
    ],
    "keywordDensity": 75,
    "readabilityScore": 85,
    "readabilityIssues": [
      "Some sentences are too long (>25 words)",
      "Consider using more bullet points for better readability"
    ],
    "sectionFeedback": {
      "personalInfo": {
        "score": 95,
        "issues": [],
        "suggestions": ["Consider adding a LinkedIn profile URL"]
      },
      "summary": {
        "score": 80,
        "issues": ["Summary could be more concise"],
        "suggestions": ["Focus on top 3-4 key achievements", "Add more industry keywords"]
      },
      "experience": {
        "score": 85,
        "issues": ["Some achievements lack quantification"],
        "suggestions": ["Add more specific metrics and numbers", "Use stronger action verbs"]
      },
      "education": {
        "score": 90,
        "issues": [],
        "suggestions": ["Consider adding relevant coursework if recent graduate"]
      },
      "skills": {
        "score": 75,
        "issues": ["Skills section could be more comprehensive"],
        "suggestions": ["Categorize skills (Technical, Soft, Languages)", "Add more industry-relevant skills"]
      }
    },
    "processedAt": "2025-01-01T00:01:30Z",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:01:30Z"
  }
}
```

**Response** (still processing):
```json
{
  "success": true,
  "message": "Your resume is still being analyzed. Please check back in a few moments.",
  "data": {
    "status": "processing",
    "message": "Your resume is being analyzed for ATS compatibility. This usually takes 10-15 seconds."
  }
}
```

**Status Codes**:
- `200`: Analysis completed, returns full results
- `202`: Analysis still in progress
- `404`: No analysis found for user

**Error Responses**:
- `404`: No analysis found for user
- `202`: Analysis still in progress (not an error, but indicates results not ready)

---

### POST /api/resume/analysis/retry
Retry failed resume analysis.

**Auth**: Required

**Response** (success):
```json
{
  "success": true,
  "message": "Analysis retry initiated successfully. Your resume will be re-analyzed shortly.",
  "data": {
    "status": "processing",
    "message": "Analysis retry initiated successfully. Your resume will be re-analyzed shortly."
  }
}
```

**Response** (no analysis found):
```json
{
  "success": false,
  "message": "No analysis found to retry. Please upload a resume first."
}
```

**Response** (parsing not complete):
```json
{
  "success": true,
  "message": "Analysis retry initiated. Waiting for resume parsing to complete first.",
  "data": {
    "status": "waiting_for_parsing",
    "message": "Analysis retry initiated. Waiting for resume parsing to complete first."
  }
}
```

**Status Codes**:
- `200`: Retry initiated successfully
- `404`: No analysis found for user

**Notes**:
- Resets analysis status and clears error messages
- If parsing is not complete, sets status to "waiting_for_parsing"
- If parsing is complete, sets status to "processing"
- Background service will pick up the retry automatically

---

## AI Agent Endpoints

### GET /api/aiagent/resume-analysis/{userId}
Get latest resume analysis for user.

**Response**:
```json
{
  "success": true,
  "message": "Resume analysis retrieved successfully",
  "data": {
    "id": 123,
    "userId": "user-id",
    "personalInfo": { /* JSON */ },
    "technicalSkills": ["JavaScript", "React"],
    "softSkills": ["Communication"],
    "programmingLanguages": ["JavaScript", "Python"],
    "tools": ["Git", "Docker"],
    "experienceSummary": "5 years...",
    "education": [{ /* JSON */ }],
    "certifications": [{ /* JSON */ }],
    "summary": "Experienced...",
    "yearsOfExperience": 5,
    "atsOverallScore": 85,
    "atsFormattingScore": 90,
    "atsKeywordsScore": 80,
    "atsExperienceScore": 85,
    "atsEducationScore": 90,
    "atsSkillsScore": 85,
    "atsAchievementsScore": 80,
    "strengths": ["Strong technical skills"],
    "weaknesses": ["Limited leadership experience"],
    "improvements": ["Add more quantifiable achievements"],
    "keywordsFound": ["JavaScript", "React"],
    "keywordsMissing": ["TypeScript"],
    "keywordDensity": 75,
    "readabilityScore": 85,
    "readabilityIssues": [],
    "recommendations": ["Add more action verbs"],
    "status": "completed",
    "processedAt": "2025-01-01T00:01:00Z"
  }
}
```

---

### POST /api/aiagent/webhook/resume-analyzed
Webhook for Lambda to store analysis results (internal use).

**Request Body**:
```json
{
  "userId": "user-id",
  "atsScore": {
    "overall": 85,
    "formatting": 90,
    "keywords": 80,
    "experience": 85,
    "education": 90,
    "skills": 85,
    "achievements": 80
  },
  /* ... other analysis data */
}
```

**Notes**:
- Sends email notification to user
- Stores analysis in database

---

## Email Preferences Endpoints

### GET /api/emailpreferences
Get user's email preferences.

**Auth**: Required

**Response**:
```json
{
  "success": true,
  "message": "Email preferences retrieved successfully",
  "data": {
    "weeklyPerformanceReport": false,
    "marketingEmails": false
  }
}
```

---

### PUT /api/emailpreferences
Update email preferences.

**Auth**: Required

**Request Body**:
```json
{
  "weeklyPerformanceReport": true,
  "marketingEmails": false
}
```

**Response**:
```json
{
  "success": true,
  "message": "Email preferences updated successfully",
  "data": {
    "weeklyPerformanceReport": true,
    "marketingEmails": false
  }
}
```

---

## Privacy Endpoints

### GET /api/privacy
Get privacy settings.

**Auth**: Required

**Response**:
```json
{
  "success": true,
  "message": "Privacy settings retrieved successfully",
  "data": {
    "profileVisibility": "public",
    "allowAnalyticsDataSharing": true
  }
}
```

**Profile Visibility Options**:
- `public`: Visible to everyone
- `private`: Only visible to user
- `connections`: Visible to connections only

---

### PUT /api/privacy
Update privacy settings.

**Auth**: Required

**Request Body**:
```json
{
  "profileVisibility": "private",
  "allowAnalyticsDataSharing": false
}
```

**Response**:
```json
{
  "success": true,
  "message": "Privacy settings updated successfully",
  "data": {
    "profileVisibility": "private",
    "allowAnalyticsDataSharing": false
  }
}
```

---

## Data Management Endpoints

### GET /api/data/export
Export all user data.

**Auth**: Required

**Response**: JSON file download

**File Name**: `hirethemnow_data_export_{email}_{timestamp}.json`

**Content**:
```json
{
  "PersonalInformation": { /* user data */ },
  "PrivacySettings": { /* privacy settings */ },
  "EmailPreferences": { /* email prefs */ },
  "TrialInformation": { /* trial data */ },
  "ResumeInformation": { /* resume data */ },
  "ExportDate": "2025-01-01T00:00:00Z",
  "ExportVersion": "1.0"
}
```

---

### DELETE /api/data/account
Delete user account and all data.

**Auth**: Required

**Request Body**:
```json
{
  "confirmation": "DELETE"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Account deleted successfully. We're sorry to see you go."
}
```

**Notes**:
- Deletes all user data from database
- Removes S3 files (resume, profile picture)
- Cascades to all related records
- Irreversible operation

---

## Industry & Skills Endpoints

### GET /api/industries
Get all industries with skills.

**Response**:
```json
{
  "success": true,
  "message": "Industries retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Technology",
      "skills": [
        {
          "id": 1,
          "name": "JavaScript",
          "industryId": 1
        }
      ]
    }
  ]
}
```

---

### GET /api/industries/{industryId}/skills
Get skills for specific industry.

**Response**:
```json
{
  "success": true,
  "message": "Skills retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "JavaScript",
      "industryId": 1
    }
  ]
}
```

---

## Release Notes Endpoints

### GET /api/releasenotes
Get latest 2 published release notes.

**Response**:
```json
{
  "success": true,
  "message": "Release notes retrieved successfully",
  "data": [
    {
      "id": 1,
      "version": "1.2.0",
      "releaseDate": "2025-09-30T00:00:00Z",
      "features": [
        "Added Privacy Controls",
        "Implemented Data Export"
      ],
      "isPublished": true,
      "createdAt": "2025-09-30T00:00:00Z"
    }
  ]
}
```

---

### GET /api/releasenotes/{id}
Get specific release note.

---

### POST /api/releasenotes
Create release note (Admin only).

**Auth**: Required

**Request Body**:
```json
{
  "version": "1.3.0",
  "releaseDate": "2025-10-01T00:00:00Z",
  "features": ["New feature 1", "New feature 2"],
  "isPublished": true
}
```

---

### PUT /api/releasenotes/{id}
Update release note (Admin only).

**Auth**: Required

---

### DELETE /api/releasenotes/{id}
Delete release note (Admin only).

**Auth**: Required

---

## Health Check Endpoints

### GET /api/health/aws-services
Check AWS services health.

**Response**:
```json
{
  "allServicesHealthy": true,
  "s3": {
    "isAccessible": true,
    "bucketName": "hirethemnow-files",
    "errorMessage": null
  },
  "textract": {
    "isAccessible": true,
    "region": "us-east-1",
    "errorMessage": null
  },
  "bedrock": {
    "isAccessible": true,
    "modelId": "amazon.nova-pro-v1:0",
    "region": "us-east-1",
    "errorMessage": null
  },
  "checkedAt": "2025-01-01T00:00:00Z"
}
```

---

## Error Handling

### Common Error Responses

**400 Bad Request**:
```json
{
  "success": false,
  "message": "Invalid request data"
}
```

**401 Unauthorized**:
```json
{
  "success": false,
  "message": "User not authenticated"
}
```

**404 Not Found**:
```json
{
  "success": false,
  "message": "Resource not found"
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "message": "An error occurred processing your request",
  "errors": ["Error details"]
}
```

### Resume Analysis Specific Errors

**Analysis Not Found (404)**:
```json
{
  "success": false,
  "message": "No resume analysis found. Please upload a resume first."
}
```

**Analysis Still Processing (202)**:
```json
{
  "success": true,
  "message": "Your resume is being analyzed for ATS compatibility. This usually takes 10-15 seconds.",
  "data": {
    "status": "processing"
  }
}
```

**Analysis Failed (200 with error details)**:
```json
{
  "success": false,
  "message": "Resume analysis failed. Please try again or contact support if the issue persists.",
  "data": null,
  "errors": ["Analysis service is temporarily unavailable. Please try again in a few minutes."]
}
```

### Resume Parsing Specific Errors

**File Too Large (400)**:
```json
{
  "success": false,
  "message": "File size exceeds the maximum limit of 5MB. Your file is 7.23MB."
}
```

**Invalid File Type (400)**:
```json
{
  "success": false,
  "message": "Invalid file type. Only PDF, DOC, and DOCX files are supported."
}
```

**Parsing Failed (200 with error details)**:
```json
{
  "success": false,
  "message": "Resume parsing failed. Please try uploading your resume again.",
  "data": {
    "status": "failed",
    "error": "The PDF file appears to be corrupted or password-protected"
  }
}
```

### Troubleshooting Guide

**Analysis Stuck in "waiting_for_parsing"**:
- Check parsing status with `/api/resume/parsing-status`
- If parsing failed, re-upload the resume
- If parsing is still processing, wait for completion

**Analysis Stuck in "processing"**:
- Analysis typically takes 10-15 seconds
- If stuck for more than 2 minutes, use `/api/resume/analysis/retry`
- Check for service status issues

**Analysis Failed**:
- Use `/api/resume/analysis/retry` to retry the analysis
- If retry fails repeatedly, the resume may have formatting issues
- Try uploading a different version of the resume

**Parsing Failed**:
- Check if PDF is password-protected or corrupted
- Try converting to a different PDF format
- Ensure file size is under 5MB
- Use a different PDF creation tool if issues persist

---

## CORS Configuration

Allowed origins:
- `https://www.hirethemnow.xyz`
- `https://hirethemnow.xyz`
- `http://localhost:8080`
- `http://hirethemnow-frontend.s3-website-us-east-1.amazonaws.com`

All methods and headers allowed with credentials.

---

## Rate Limiting

Currently no rate limiting implemented. Consider adding for production.

---

## API Versioning

Currently no versioning. All endpoints are v1 by default.

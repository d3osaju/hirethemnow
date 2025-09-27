# N8N Workflow Integration Guide

This document outlines the webhook endpoints and data structures for integrating N8N workflows with the HireThemNow application.

## Overview

The application uses three main N8N workflows:
1. **Resume Analysis Workflow** - Analyzes uploaded resumes and generates cold email templates
2. **HR Scraping Workflow** - Scrapes HR contacts from the internet grouped by industry/skills
3. **Cold Email Campaign Workflow** - Sends emails via testmail.app and tracks responses

## 1. Resume Analysis Workflow

### Trigger Endpoint
**Webhook URL**: `https://your-n8n-instance.com/webhook/resume-analysis`
**Method**: POST

### Input Payload (from API)
```json
{
  "userId": "user-guid",
  "userEmail": "user@example.com",
  "resumeFilePath": "/path/to/uploaded/resume.pdf",
  "resumeFileName": "resume.pdf"
}
```

### Expected Output (to API)
**Result Webhook**: `POST /api/resume/analysis/result`
```json
{
  "userId": "user-guid",
  "analysis": {
    "skills": ["JavaScript", "React", "Node.js"],
    "workExperience": "5 years software development...",
    "education": "Bachelor's in Computer Science",
    "summary": "Experienced full-stack developer..."
  },
  "coldEmailTemplates": [
    "Template 1 content...",
    "Template 2 content...",
    "Template 3 content...",
    "Template 4 content...",
    "Template 5 content..."
  ]
}
```

**Error Webhook**: `POST /api/resume/analysis/error`
```json
{
  "userId": "user-guid",
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 2. HR Scraping Workflow

### Trigger Endpoint
**Webhook URL**: `https://your-n8n-instance.com/webhook/hr-scraping`
**Method**: POST

### Input Payload (from API)
```json
{
  "skills": ["JavaScript", "React", "Node.js"],
  "industries": ["Technology", "Software"],
  "location": "optional-location"
}
```

### Expected Output (to API)
**Result Webhook**: `POST /api/hrcontacts/bulk`
```json
{
  "contacts": [
    {
      "name": "Jane Doe",
      "email": "jane.doe@company.com",
      "company": "Tech Corp",
      "position": "HR Manager",
      "industry": "Technology",
      "skills": ["JavaScript", "React"],
      "linkedInProfile": "https://linkedin.com/in/janedoe",
      "source": "LinkedIn"
    }
  ]
}
```

## 3. Cold Email Campaign Workflow

### Trigger Endpoint
**Webhook URL**: `https://your-n8n-instance.com/webhook/cold-email-campaign`
**Method**: POST

### Input Payload (from API)
```json
{
  "campaignId": "campaign-guid",
  "userId": "user-guid",
  "userEmail": "user@example.com",
  "userName": "John Smith",
  "hrContacts": [
    {
      "id": "hr-contact-guid",
      "name": "Jane Doe",
      "email": "jane.doe@company.com",
      "company": "Tech Corp"
    }
  ],
  "emailTemplates": [
    "Template 1 content...",
    "Template 2 content..."
  ]
}
```

### Expected Output (to API)
**Email Sent Webhook**: `POST /api/coldemail/outreach/sent`
```json
{
  "campaignId": "campaign-guid",
  "hrContactId": "hr-contact-guid",
  "emailTemplate": "Template content used",
  "testmailEmailId": "testmail-generated-id",
  "sentAt": "2024-01-01T00:00:00Z"
}
```

## 4. Email Reply Tracking

### Testmail.app Integration
Use testmail.app webhooks to track email replies and forward them to our API.

### Reply Received Webhook
**Endpoint**: `POST /api/mailbox/reply/received`
```json
{
  "testmailEmailId": "original-email-id",
  "fromEmail": "jane.doe@company.com",
  "toEmail": "generated@testmail.app",
  "subject": "Re: Job Application",
  "content": "Thank you for your application...",
  "receivedAt": "2024-01-01T00:00:00Z"
}
```

## 5. Email Analysis Workflow

### Trigger Endpoint
**Webhook URL**: `https://your-n8n-instance.com/webhook/email-analysis`
**Method**: POST

### Input Payload (from API)
```json
{
  "emailId": "email-guid",
  "content": "Email content to analyze",
  "subject": "Email subject"
}
```

### Expected Output (to API)
**Analysis Result Webhook**: `POST /api/mailbox/analysis/result`
```json
{
  "emailId": "email-guid",
  "sentiment": "Positive",
  "confidence": 0.85,
  "hasInterviewInvitation": true,
  "isRejection": false,
  "isPositiveResponse": true,
  "interviewDetails": "Interview scheduled for next Tuesday at 2 PM",
  "nextSteps": "Prepare for technical interview"
}
```

## Configuration

### Backend Configuration
Update the N8N webhook URLs in your controllers:

1. **ResumeController.cs** - Line 261: Update `n8nWebhookUrl`
2. **ColdEmailController.cs** - Line 85: Update N8N campaign trigger URL
3. **HRContactsController.cs** - Line 65: Update HR scraping trigger URL

### Environment Variables
```bash
N8N_RESUME_ANALYSIS_WEBHOOK=https://your-n8n-instance.com/webhook/resume-analysis
N8N_HR_SCRAPING_WEBHOOK=https://your-n8n-instance.com/webhook/hr-scraping
N8N_COLD_EMAIL_WEBHOOK=https://your-n8n-instance.com/webhook/cold-email-campaign
N8N_EMAIL_ANALYSIS_WEBHOOK=https://your-n8n-instance.com/webhook/email-analysis
TESTMAIL_API_KEY=your-testmail-api-key
```

## Testing

### 1. Test Resume Analysis
```bash
curl -X POST https://your-n8n-instance.com/webhook/resume-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "userEmail": "test@example.com",
    "resumeFilePath": "/path/to/test-resume.pdf",
    "resumeFileName": "test-resume.pdf"
  }'
```

### 2. Test Email Analysis
```bash
curl -X POST https://your-n8n-instance.com/webhook/email-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "emailId": "test-email-id",
    "content": "Thank you for your application. We would like to schedule an interview.",
    "subject": "Interview Invitation"
  }'
```

## Error Handling

All N8N workflows should implement error handling and send error notifications to the appropriate error endpoints:
- `/api/resume/analysis/error`
- `/api/coldemail/error`
- `/api/mailbox/analysis/error`

## Security

- All webhook endpoints use HTTPS
- API endpoints require proper authentication where applicable
- Sensitive data (email content, resume content) should be handled securely
- Consider implementing webhook signature verification for production
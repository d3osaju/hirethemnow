# Resume Parsing Background Processing Architecture

## Overview

The resume parsing system now uses a **background processing architecture** that decouples file upload from parsing, providing better performance and reliability.

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Upload Flow                                  │
└─────────────────────────────────────────────────────────────────────┘

1. User uploads resume via API
   ↓
2. File uploaded to S3 (hirethemnow-files/resumes/)
   ↓
3. User.ResumeUrl updated with S3 key
   ↓
4. ResumeContent record created with status="pending"
   ↓
5. API returns immediately (fast response)


┌─────────────────────────────────────────────────────────────────────┐
│                    Background Processing Flow                        │
└─────────────────────────────────────────────────────────────────────┘

1. Background service polls ResumeContents table every 10s
   ↓
2. Finds records with status="pending"
   ↓
3. Updates status to "processing"
   ↓
4. Fetches file from S3 using S3 key
   ↓
5. Calls AWS Bedrock to parse resume
   ↓
6. Saves structured content to database
   ↓
7. Updates status to "completed" or "failed"
```

## Components

### 1. ResumeController (Upload Endpoint)

**Responsibilities:**
- Validate file (type, size)
- Upload to S3
- Update User.ResumeUrl
- Create ResumeContent record with status="pending"
- Return immediately

**Key Changes:**
- No longer calls parsing service synchronously
- Creates pending record for background processing
- Returns faster response to user

### 2. ResumeParsingBackgroundService

**Type:** Hosted Service (runs continuously)

**Responsibilities:**
- Poll ResumeContents table for pending records
- Process up to N resumes concurrently
- Update status throughout processing
- Handle errors and retries

**Configuration:**
```json
{
  "ResumeParsing": {
    "EnableBackgroundProcessing": true,
    "PollingIntervalSeconds": 10,
    "MaxConcurrentProcessing": 3
  }
}
```

**Key Features:**
- Configurable polling interval (default: 10 seconds)
- Concurrent processing (default: 3 at a time)
- Automatic retry on cancellation
- Comprehensive logging with timing metrics
- Graceful shutdown handling

### 3. Database Tables

#### ResumeContents Table
Tracks parsing status and stores parsed content.

**Key Fields:**
- `Id`: Primary key
- `UserId`: Links to user
- `S3Key`: Location in S3 bucket
- `FileName`: Original filename
- `ParsingStatus`: "pending" | "processing" | "completed" | "failed"
- `ParsedContent`: JSON structured content
- `TextContent`: Plain text extraction
- `ParsingError`: Error message if failed
- `UploadedAt`: When file was uploaded
- `ParsedAt`: When parsing completed

**Status Flow:**
```
pending → processing → completed
                    ↘ failed
```

#### Users Table
Stores user information including resume reference.

**Key Fields:**
- `Id`: User ID
- `ResumeUrl`: S3 key of latest resume (same as ResumeContent.S3Key)

## Benefits

### 1. **Fast API Response**
- Upload endpoint returns immediately
- User doesn't wait for parsing to complete
- Better user experience

### 2. **Decoupled Processing**
- Upload and parsing are independent
- Parsing failures don't affect upload
- Can retry parsing without re-uploading

### 3. **Scalability**
- Multiple resumes processed concurrently
- Configurable concurrency level
- Can scale horizontally (multiple instances)

### 4. **Reliability**
- Failed parses can be retried
- Cancellation handling (resets to pending)
- Comprehensive error logging

### 5. **Monitoring**
- Clear status tracking in database
- Processing time metrics
- Easy to identify stuck jobs

## Configuration

### appsettings.json

```json
{
  "AWS": {
    "S3": {
      "BucketName": "hirethemnow-files"
    }
  },
  "ResumeParsing": {
    "EnableBackgroundProcessing": true,
    "PollingIntervalSeconds": 10,
    "MaxConcurrentProcessing": 3,
    "ParsingTimeoutSeconds": 30,
    "MaxFileSizeBytes": 5242880,
    "SupportedFormats": ["pdf", "docx", "doc"],
    "BedrockModelId": "anthropic.claude-3-sonnet-20240229-v1:0"
  }
}
```

### Configuration Options

| Setting | Default | Description |
|---------|---------|-------------|
| `EnableBackgroundProcessing` | `false` | Enable/disable background service |
| `PollingIntervalSeconds` | `10` | How often to check for pending resumes |
| `MaxConcurrentProcessing` | `3` | Max resumes to process simultaneously |
| `ParsingTimeoutSeconds` | `30` | Timeout for Bedrock parsing |

## API Endpoints

### POST /api/resume/upload
Upload a resume file.

**Response:**
```json
{
  "success": true,
  "message": "Resume uploaded successfully! We're parsing your resume in the background.",
  "data": {
    "resumeUrl": "resumes/2025/01/06/guid_filename.pdf",
    "fileName": "resume.pdf",
    "status": "pending",
    "parsingStatus": "pending",
    "parsingId": 123
  }
}
```

### GET /api/resume/parsing-status
Check parsing status.

**Response (Pending):**
```json
{
  "success": true,
  "message": "Parsing status retrieved successfully",
  "data": {
    "id": 123,
    "fileName": "resume.pdf",
    "status": "pending",
    "uploadedAt": "2025-01-06T10:00:00Z",
    "parsedAt": null,
    "error": null
  }
}
```

**Response (Completed):**
```json
{
  "success": true,
  "message": "Parsing status retrieved successfully",
  "data": {
    "id": 123,
    "fileName": "resume.pdf",
    "status": "completed",
    "uploadedAt": "2025-01-06T10:00:00Z",
    "parsedAt": "2025-01-06T10:00:15Z",
    "error": null
  }
}
```

### GET /api/resume/content
Get parsed resume content.

**Response (Processing):**
```json
{
  "success": true,
  "message": "Your resume is being parsed. This usually takes a few seconds.",
  "data": {
    "status": "processing",
    "uploadedAt": "2025-01-06T10:00:00Z",
    "fileName": "resume.pdf"
  }
}
```

**Response (Completed):**
```json
{
  "success": true,
  "message": "Resume content retrieved successfully",
  "data": {
    "id": 123,
    "fileName": "resume.pdf",
    "contentType": "pdf",
    "parsedContent": "{...structured JSON...}",
    "textContent": "Plain text content...",
    "status": "completed",
    "uploadedAt": "2025-01-06T10:00:00Z",
    "parsedAt": "2025-01-06T10:00:15Z"
  }
}
```

## Logging

### Log Levels

**Information:**
- Service start/stop
- Pending resumes found
- Processing start/completion
- Status updates
- Performance metrics

**Warning:**
- Service disabled
- Parsing failures (expected errors)
- Timeout warnings

**Error:**
- Unexpected exceptions
- Database errors
- Service failures

**Debug:**
- S3 URL construction
- No pending resumes found
- Detailed operation flow

### Example Logs

```
[Information] Resume parsing background service initialized with polling interval: 10s, max concurrent: 3
[Information] Resume parsing background service starting
[Information] Found 2 pending resume(s) to process
[Information] Starting background processing for resume content ID 123, user user-456, file: resume.pdf
[Information] Updated status to processing for resume content ID 123
[Debug] Built S3 URL: s3://hirethemnow-files/resumes/2025/01/06/guid_resume.pdf for resume content ID 123
[Information] Bedrock parsing completed in 3.45s for resume content ID 123, success: True
[Information] Successfully completed background parsing for resume content ID 123, user user-456, total time: 4.12s
```

## Error Handling

### Retry Logic

**Automatic Retry:**
- Cancellation (service shutdown) → Status reset to "pending"
- Will be picked up in next polling cycle

**Manual Retry:**
- Update `ParsingStatus` to "pending" in database
- Background service will reprocess

### Error States

**Failed Status:**
- Parsing errors
- Bedrock API errors
- Unexpected exceptions
- Error message stored in `ParsingError` field

**Recovery:**
- Check logs for detailed error
- Fix underlying issue
- Reset status to "pending" for retry

## Monitoring

### Health Checks

Monitor these metrics:
1. **Pending count**: How many resumes waiting
2. **Processing time**: Average time to parse
3. **Failure rate**: Percentage of failed parses
4. **Queue depth**: Backlog of pending resumes

### Database Queries

**Check pending resumes:**
```sql
SELECT COUNT(*) FROM "ResumeContents" WHERE "ParsingStatus" = 'pending';
```

**Check failed resumes:**
```sql
SELECT * FROM "ResumeContents" 
WHERE "ParsingStatus" = 'failed' 
ORDER BY "UploadedAt" DESC;
```

**Average processing time:**
```sql
SELECT AVG(EXTRACT(EPOCH FROM ("ParsedAt" - "UploadedAt"))) as avg_seconds
FROM "ResumeContents" 
WHERE "ParsingStatus" = 'completed' 
AND "ParsedAt" IS NOT NULL;
```

## Deployment Considerations

### Production Settings

```json
{
  "ResumeParsing": {
    "EnableBackgroundProcessing": true,
    "PollingIntervalSeconds": 5,
    "MaxConcurrentProcessing": 5,
    "ParsingTimeoutSeconds": 60
  }
}
```

### Scaling

**Vertical Scaling:**
- Increase `MaxConcurrentProcessing`
- Requires more CPU/memory

**Horizontal Scaling:**
- Run multiple instances
- Each instance processes independently
- Database handles concurrency (status updates)

### Graceful Shutdown

- Service handles cancellation tokens
- In-progress parsing resets to "pending"
- No data loss on shutdown

## Future Enhancements

1. **Priority Queue**: Process VIP users first
2. **Retry Limits**: Max retry attempts before permanent failure
3. **Dead Letter Queue**: Separate table for permanently failed jobs
4. **Webhooks**: Notify users when parsing completes
5. **Batch Processing**: Process multiple files in single Bedrock call
6. **Caching**: Cache parsed results for duplicate files
7. **Metrics Dashboard**: Real-time monitoring UI

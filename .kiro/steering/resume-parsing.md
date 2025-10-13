# Resume Parsing System Documentation

## Overview

HireThemNow uses a two-stage resume parsing system:
1. **Text Extraction**: PdfPig library extracts plain text from PDF files
2. **AI Structuring**: AWS Bedrock (Amazon Nova Pro) structures the text into JSON format

## Architecture

### Components

1. **ResumeController**: Handles resume upload API endpoint
2. **ResumeParsingService**: Core parsing logic
3. **ResumeParsingBackgroundService**: Background worker for async processing
4. **BedrockAgentService**: AWS Bedrock integration
5. **S3Service**: File storage and retrieval

### Processing Flow

```
User uploads PDF
    ↓
Store in S3 with "pending" status
    ↓
Create ResumeContent record (status: pending)
    ↓
Create ResumeAnalysis record (status: waiting_for_parsing)
    ↓
Background service polls for pending resumes (PARSING PHASE)
    ↓
Download PDF from S3
    ↓
PdfPig extracts text
    ↓
Send text to Bedrock Nova Pro for structuring
    ↓
Bedrock returns structured JSON
    ↓
Store parsed content in database (status: completed)
    ↓
Send parsing complete email notification
    ↓
Background service polls for pending analyses (ANALYSIS PHASE)
    ↓
Retrieve parsed content from database
    ↓
Send structured content to Bedrock Nova Pro for ATS analysis
    ↓
Bedrock returns detailed ATS analysis with scores
    ↓
Calculate weighted overall score
    ↓
Store analysis results in database (status: completed)
    ↓
Send analysis complete email notification with ATS score
```

## Configuration

### appsettings.json

```json
{
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
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| MaxFileSizeBytes | int | 5242880 | Max file size (5MB) |
| ParsingTimeoutSeconds | int | 30 | Bedrock timeout for parsing |
| AnalysisTimeoutSeconds | int | 45 | Bedrock timeout for ATS analysis |
| SupportedFormats | string[] | ["pdf"] | Allowed file types |
| EnableBackgroundProcessing | bool | true | Enable background worker |
| PollingIntervalSeconds | int | 10 | Background polling interval |
| MaxConcurrentProcessing | int | 3 | Max concurrent processing (parsing + analysis) |
| BedrockModelId | string | amazon.nova-pro-v1:0 | Bedrock model for parsing |
| AnalysisBedrockModelId | string | amazon.nova-pro-v1:0 | Bedrock model for ATS analysis |
| AnalysisMaxTokens | int | 8192 | Max tokens for analysis (increased for detailed feedback) |
| AnalysisTemperature | float | 0.2 | Temperature for analysis (low for consistency) |
| AnalysisTopP | float | 0.9 | TopP for analysis |

## Supported Formats

Currently **PDF only**. The system validates:
- File extension: `.pdf`
- File size: Max 5MB
- Content type: `application/pdf`

## Text Extraction (PdfPig)

### Library
- **Name**: PdfPig
- **Version**: Latest stable
- **License**: Apache 2.0 (open-source)
- **Purpose**: Extract text from PDF files

### Features
- Handles standard PDF text
- Preserves text order
- Extracts metadata
- No AWS Textract required

### Error Handling

Common errors:
- **Corrupted PDF**: "The PDF file appears to be corrupted or password-protected"
- **Encrypted PDF**: Same as corrupted
- **Invalid format**: "Only PDF files are currently supported"
- **File too large**: "The file is too large. Please upload a PDF file smaller than 5MB"

## AI Structuring (AWS Bedrock)

### Model
- **Model ID**: `amazon.nova-pro-v1:0`
- **Provider**: AWS Bedrock
- **Type**: Large Language Model
- **Purpose**: Structure extracted text into JSON

### Prompt Template

The system sends extracted text with this prompt:

```
You are a resume parsing assistant. Extract and structure the following resume text into JSON format.

Resume Text:
{extracted_text}

Return ONLY valid JSON with this structure:
{
  "personalInfo": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "portfolio": "string",
    "github": "string"
  },
  "experience": [
    {
      "company": "string",
      "title": "string",
      "startDate": "string",
      "endDate": "string",
      "isCurrent": boolean,
      "location": "string",
      "description": "string",
      "achievements": ["string"],
      "technologies": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "startDate": "string",
      "endDate": "string",
      "gpa": "string",
      "honors": ["string"]
    }
  ],
  "skills": {
    "technical": ["string"],
    "soft": ["string"],
    "languages": ["string"],
    "tools": ["string"]
  },
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "string",
      "expirationDate": "string",
      "credentialId": "string"
    }
  ],
  "summary": "string",
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "link": "string",
      "github": "string"
    }
  ]
}
```

### Bedrock Configuration

```csharp
var requestBody = new
{
    messages = new[]
    {
        new
        {
            role = "user",
            content = new[]
            {
                new { text = prompt }
            }
        }
    },
    inferenceConfig = new
    {
        maxTokens = 4096,
        temperature = 0.0,
        topP = 0.9
    }
};
```

### Response Parsing

The system:
1. Receives JSON response from Bedrock
2. Extracts content from response structure
3. Parses JSON into `StructuredResumeContent` object
4. Validates required fields
5. Stores in database

## Background Processing

### ResumeParsingBackgroundService

A hosted service that runs continuously with dual-phase processing:

```csharp
protected override async Task ExecuteAsync(CancellationToken stoppingToken)
{
    while (!stoppingToken.IsCancellationRequested)
    {
        // Phase 1: Process pending resumes (parsing priority)
        await ProcessPendingResumesAsync();
        
        // Phase 2: Process pending analyses (after parsing completes)
        await ProcessPendingAnalysesAsync();
        
        await Task.Delay(TimeSpan.FromSeconds(pollingInterval), stoppingToken);
    }
}
```

### Processing Logic

**Phase 1 - Resume Parsing**:
1. **Query pending resumes**: Get ResumeContent records with status "pending"
2. **Update status**: Set to "processing"
3. **Download from S3**: Get PDF file
4. **Extract text**: Use PdfPig
5. **Structure with AI**: Call Bedrock for content structuring
6. **Store results**: Update database with structured content
7. **Update status**: Set to "completed" or "failed"
8. **Send notification**: Email user about parsing completion

**Phase 2 - ATS Analysis**:
1. **Query pending analyses**: Get ResumeAnalysis records with status "waiting_for_parsing"
2. **Check parsing status**: Verify corresponding ResumeContent is "completed"
3. **Update status**: Set analysis to "processing"
4. **Retrieve parsed content**: Get structured content from database
5. **Analyze with AI**: Call Bedrock for detailed ATS analysis
6. **Calculate scores**: Apply weighted scoring algorithm
7. **Store results**: Update database with analysis results
8. **Update status**: Set to "completed" or "failed"
9. **Send notification**: Email user with ATS score and results

### Concurrency

- Max concurrent processing: 3 total (configurable) across both parsing and analysis
- Polling interval: 10 seconds (configurable)
- Parsing takes priority over analysis
- Each resume/analysis processed independently
- Failures don't block other processing
- Available slots calculated dynamically (parsing first, then analysis)

## Database Schema

### ResumeContent Table

```sql
CREATE TABLE resume_contents (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    s3_key VARCHAR NOT NULL,
    file_name VARCHAR NOT NULL,
    content_type VARCHAR NOT NULL,
    parsed_content TEXT NOT NULL,
    text_content TEXT,
    parsing_status VARCHAR NOT NULL DEFAULT 'pending',
    parsing_error TEXT,
    file_size_bytes BIGINT NOT NULL,
    uploaded_at TIMESTAMP NOT NULL,
    parsed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_resume_contents_user_id ON resume_contents(user_id);
CREATE INDEX idx_resume_contents_user_uploaded ON resume_contents(user_id, uploaded_at);
```

### ResumeAnalysis Table

```sql
CREATE TABLE resume_analyses (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    resume_content_id INTEGER,
    status VARCHAR NOT NULL DEFAULT 'waiting_for_parsing',
    analysis_error TEXT,
    ats_overall_score INTEGER,
    ats_formatting_score INTEGER,
    ats_keywords_score INTEGER,
    ats_experience_score INTEGER,
    ats_education_score INTEGER,
    ats_skills_score INTEGER,
    ats_achievements_score INTEGER,
    strengths TEXT, -- JSON array
    weaknesses TEXT, -- JSON array
    recommendations TEXT, -- JSON array
    keywords_found TEXT, -- JSON array
    keywords_missing TEXT, -- JSON array
    keyword_density INTEGER,
    readability_score INTEGER,
    readability_issues TEXT, -- JSON array
    section_feedback TEXT, -- JSON object
    processed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resume_content_id) REFERENCES resume_contents(id) ON DELETE SET NULL
);

CREATE INDEX idx_resume_analyses_user_id ON resume_analyses(user_id);
CREATE INDEX idx_resume_analyses_status ON resume_analyses(status);
```

### Status Values

**ResumeContent**:
- `pending`: Waiting for processing
- `processing`: Currently being parsed
- `completed`: Successfully parsed
- `failed`: Parsing failed (see parsing_error)

**ResumeAnalysis**:
- `waiting_for_parsing`: Created, waiting for parsing to complete
- `processing`: Currently being analyzed
- `completed`: Analysis finished successfully
- `failed`: Analysis failed (see analysis_error)

## API Integration

### Upload Endpoint

```http
POST /api/resume/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}

resume: <file>
```

### Status Check

```http
GET /api/resume/parsing-status
Authorization: Bearer {token}
```

### Get Content

```http
GET /api/resume/content
Authorization: Bearer {token}
```

### Get History

```http
GET /api/resume/content/history
Authorization: Bearer {token}
```

## Error Handling

### User-Friendly Messages

The system provides clear error messages:

| Error Type | User Message |
|------------|--------------|
| Corrupted PDF | "The PDF file appears to be corrupted or password-protected" |
| File too large | "The file is too large. Please upload a PDF file smaller than 5MB" |
| Unsupported format | "Only PDF files are currently supported" |
| Service unavailable | "Resume parsing service is temporarily unavailable" |
| Bedrock error | "Failed to parse resume. Please try again" |
| S3 error | "Failed to upload file to storage. Please try again" |

### Error Logging

All errors logged with context:
```csharp
_logger.LogError(ex, 
    "Failed to parse resume for user {UserId}, ResumeContentId {ResumeContentId}", 
    userId, resumeContentId);
```

### Retry Logic

- No automatic retries (user must re-upload)
- Failed resumes remain in database with error message
- User can view error in parsing status

## Performance

### Metrics

- **Text extraction**: ~1-2 seconds (PdfPig)
- **AI structuring**: ~5-10 seconds (Bedrock)
- **Total time**: ~6-12 seconds per resume
- **Concurrent processing**: Up to 3 resumes simultaneously

### Optimization

1. **Background processing**: Doesn't block user
2. **Polling interval**: 10 seconds (adjustable)
3. **Concurrent processing**: 3 resumes at once
4. **S3 pre-signed URLs**: Fast file access
5. **Database indexing**: Fast status queries

## AWS Permissions Required

### S3
- `s3:GetObject` - Download resumes
- `s3:PutObject` - Upload resumes
- `s3:DeleteObject` - Delete old resumes

### Bedrock
- `bedrock:InvokeModel` - Call Nova Pro model

### SES (for notifications)
- `ses:SendEmail` - Send completion emails

## Testing

### Unit Tests

Test cases:
1. PDF text extraction
2. Bedrock response parsing
3. Error handling
4. Status transitions
5. Concurrent processing

### Integration Tests

Test scenarios:
1. Upload → Parse → Retrieve flow
2. Multiple concurrent uploads
3. Error recovery
4. Background service behavior

### Manual Testing

1. Upload valid PDF
2. Upload corrupted PDF
3. Upload oversized file
4. Upload non-PDF file
5. Check parsing status
6. Retrieve parsed content
7. View parsing history

## Monitoring

### Logs to Monitor

- Resume upload events
- Parsing start/completion
- Bedrock API calls
- Errors and failures
- Background service health

### CloudWatch Metrics

Consider tracking:
- Parsing success rate
- Average parsing time
- Bedrock API latency
- Error rate by type
- Queue depth (pending resumes)

## Future Enhancements

### Potential Improvements

1. **Support more formats**: DOC, DOCX
2. **Batch processing**: Process multiple resumes
3. **Caching**: Cache Bedrock responses
4. **Webhooks**: Real-time status updates
5. **Advanced parsing**: Extract more fields
6. **Quality scoring**: Rate resume quality
7. **Comparison**: Compare multiple resumes
8. **Templates**: Suggest improvements

### Scalability

For high volume:
1. Use SQS for queue management
2. Lambda for serverless parsing
3. DynamoDB for faster status checks
4. ElastiCache for caching
5. Step Functions for orchestration

## Troubleshooting

### Common Issues

**Issue**: Parsing stuck in "pending"
- **Cause**: Background service not running
- **Fix**: Check service logs, restart application

**Issue**: All parses failing
- **Cause**: Bedrock permissions or quota
- **Fix**: Check IAM permissions, Bedrock quotas

**Issue**: Slow parsing
- **Cause**: Large PDFs or Bedrock latency
- **Fix**: Increase timeout, optimize PDF size

**Issue**: Incorrect parsing
- **Cause**: Poor PDF quality or complex layout
- **Fix**: Improve prompt, use better PDF

### Debug Commands

```bash
# Check background service logs
grep "ResumeParsingBackgroundService" logs.txt

# Check Bedrock calls
grep "Bedrock" logs.txt

# Check parsing errors
grep "Failed to parse resume" logs.txt
```

## Best Practices

1. **Validate files** before upload
2. **Use background processing** for long operations
3. **Provide status updates** to users
4. **Handle errors gracefully** with clear messages
5. **Log everything** for debugging
6. **Monitor performance** and errors
7. **Test with various PDFs** (different formats, sizes)
8. **Set reasonable timeouts** (30 seconds)
9. **Limit concurrent processing** (3 resumes)
10. **Clean up old files** periodically

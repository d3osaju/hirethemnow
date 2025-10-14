# Resume Parsing System Documentation

## Overview

HireThemNow uses a comprehensive two-phase resume processing system that combines parsing and analysis:

### Phase 1: Resume Parsing
1. **Text Extraction**: PdfPig library extracts plain text from PDF files
2. **AI Structuring**: AWS Bedrock (Amazon Nova Pro) structures the text into JSON format

### Phase 2: ATS Analysis
1. **Content Analysis**: AWS Bedrock analyzes the structured content for ATS compatibility
2. **Score Calculation**: Generates detailed scores across multiple dimensions (formatting, keywords, experience, etc.)
3. **Recommendations**: Provides actionable feedback for resume improvement

The two phases are **automatically linked** - when parsing completes successfully, the analysis phase begins immediately without user intervention.

## Architecture

### Two-Phase Processing Model

The system implements a **sequential two-phase processing architecture** where each phase has distinct responsibilities:

**Phase 1: Resume Parsing**
- Converts unstructured PDF content into structured JSON data
- Focuses on data extraction and organization
- Uses parsing-optimized Bedrock configuration (lower temperature for consistency)
- Creates foundation for subsequent analysis

**Phase 2: ATS Analysis** 
- Analyzes structured content for ATS compatibility and optimization
- Generates detailed scoring across multiple dimensions
- Uses analysis-optimized Bedrock configuration (higher token limits for detailed feedback)
- Provides actionable recommendations for improvement

**Automatic Transition**: The system automatically transitions from parsing to analysis when parsing completes successfully. Analysis records are created with status "waiting_for_parsing" and automatically progress to "processing" once the corresponding parsing is complete.

### Components

1. **ResumeController**: Handles resume upload API endpoint and creates both parsing and analysis records
2. **ResumeParsingService**: Core parsing logic for Phase 1 (text extraction and structuring)
3. **ResumeAnalysisService**: Core analysis logic for Phase 2 (ATS scoring and recommendations)
4. **ResumeParsingBackgroundService**: Dual-phase background worker that processes both parsing and analysis
5. **BedrockAgentService**: AWS Bedrock integration with different configurations for parsing vs analysis
6. **S3Service**: File storage and retrieval

### Processing Flow

The system follows a **sequential two-phase processing flow** with automatic transition between phases:

```
┌─────────────────────────────────────────────────────────────────┐
│                        UPLOAD & INITIALIZATION                  │
└─────────────────────────────────────────────────────────────────┘
User uploads PDF
    ↓
Store in S3 with "pending" status
    ↓
Create ResumeContent record (status: pending)
    ↓
Create ResumeAnalysis record (status: waiting_for_parsing) ← AUTOMATIC LINKING
    ↓
┌─────────────────────────────────────────────────────────────────┐
│                         PHASE 1: PARSING                       │
│                    (Priority Processing)                        │
└─────────────────────────────────────────────────────────────────┘
Background service polls for pending resumes
    ↓
Update ResumeContent status to "processing"
    ↓
Download PDF from S3
    ↓
PdfPig extracts plain text
    ↓
Send text to Bedrock Nova Pro (parsing configuration)
    ↓
Bedrock returns structured JSON
    ↓
Store parsed content in database
    ↓
Update ResumeContent status to "completed"
    ↓
Send parsing complete email notification
    ↓
AUTOMATIC TRIGGER: ResumeAnalysis status changes from "waiting_for_parsing" to ready for processing
    ↓
┌─────────────────────────────────────────────────────────────────┐
│                        PHASE 2: ANALYSIS                       │
│                   (Dependent on Phase 1)                       │
└─────────────────────────────────────────────────────────────────┘
Background service polls for pending analyses
    ↓
Verify ResumeContent status is "completed" ← DEPENDENCY CHECK
    ↓
Update ResumeAnalysis status to "processing"
    ↓
Retrieve structured content from database
    ↓
Send structured content to Bedrock Nova Pro (analysis configuration)
    ↓
Bedrock returns detailed ATS analysis with scores
    ↓
Calculate weighted overall score (formatting: 20%, keywords: 25%, experience: 20%, education: 10%, skills: 15%, achievements: 10%)
    ↓
Store analysis results in database
    ↓
Update ResumeAnalysis status to "completed"
    ↓
Send analysis complete email notification with ATS score and recommendations
```

### Phase Relationship and Dependencies

**Sequential Dependency**: Phase 2 (Analysis) cannot begin until Phase 1 (Parsing) completes successfully. The system enforces this through:

1. **Status Linking**: ResumeAnalysis records start with "waiting_for_parsing" status
2. **Dependency Verification**: Analysis processing checks that corresponding ResumeContent has "completed" status
3. **Automatic Transition**: No manual intervention required - the system automatically progresses from parsing to analysis
4. **Error Isolation**: If parsing fails, analysis remains in "waiting_for_parsing" state until parsing succeeds

**Processing Priority**: The background service prioritizes parsing over analysis to ensure the dependency chain flows efficiently:
- Parsing tasks are processed first in each polling cycle
- Analysis tasks are processed only after parsing tasks are handled
- This ensures maximum throughput while respecting dependencies

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

### Dual Bedrock Model Configuration

The system uses **separate Bedrock configurations** for parsing and analysis phases to optimize each operation:

**Parsing Configuration** (Phase 1):
- **BedrockModelId**: `amazon.nova-pro-v1:0` - Model used for structuring extracted text into JSON
- **ParsingTimeoutSeconds**: `30` - Shorter timeout for faster parsing operations
- **Temperature**: `0.0` (hardcoded) - Maximum consistency for data extraction
- **MaxTokens**: `4096` (hardcoded) - Sufficient for structured JSON output

**Analysis Configuration** (Phase 2):
- **AnalysisBedrockModelId**: `amazon.nova-pro-v1:0` - Model used for detailed ATS analysis
- **AnalysisTimeoutSeconds**: `45` - Longer timeout for complex analysis operations
- **AnalysisTemperature**: `0.2` - Low temperature for consistent scoring and recommendations
- **AnalysisTopP**: `0.9` - High TopP for diverse but relevant feedback
- **AnalysisMaxTokens**: `8192` - Higher token limit for detailed analysis and recommendations

This dual configuration approach allows:
1. **Optimized Performance**: Each phase uses settings tuned for its specific purpose
2. **Independent Scaling**: Parsing and analysis can use different models or configurations
3. **Cost Control**: Different token limits and timeouts based on operation complexity
4. **Quality Assurance**: Parsing prioritizes consistency while analysis balances consistency with detailed feedback

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

A hosted service that runs continuously with **dual-phase processing** architecture. The service implements a sophisticated polling mechanism that coordinates both resume parsing and analysis phases while maintaining proper dependencies and resource allocation.

#### Service Architecture

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

#### Dual-Phase Polling Mechanism

The background service implements a **sequential dual-phase polling system** that ensures proper dependency management and resource utilization:

**Polling Cycle Structure**:
1. **Phase 1 Polling**: Query and process pending resume parsing tasks
2. **Phase 2 Polling**: Query and process pending analysis tasks (only after Phase 1 completes)
3. **Wait Interval**: Configurable delay (default: 10 seconds) before next cycle
4. **Repeat**: Continuous loop until service shutdown

**Polling Queries**:
- **Phase 1**: `SELECT * FROM resume_contents WHERE parsing_status = 'pending' ORDER BY uploaded_at ASC`
- **Phase 2**: `SELECT * FROM resume_analyses WHERE status = 'waiting_for_parsing' AND resume_content_id IN (SELECT id FROM resume_contents WHERE parsing_status = 'completed') ORDER BY created_at ASC`

**Polling Frequency**:
- **Interval**: 10 seconds (configurable via `PollingIntervalSeconds`)
- **Continuous**: Service runs 24/7 without interruption
- **Graceful Shutdown**: Respects cancellation tokens for clean service stops

#### Priority System (Parsing Before Analysis)

The service implements a **strict priority system** that ensures parsing always takes precedence over analysis:

**Priority Enforcement**:
1. **Sequential Processing**: Phase 1 (parsing) always completes before Phase 2 (analysis) begins in each cycle
2. **Resource Allocation**: Available processing slots are allocated to parsing first, then analysis
3. **Dependency Respect**: Analysis cannot begin until corresponding parsing is complete
4. **Queue Management**: Parsing tasks are processed in upload order (FIFO), analysis tasks in creation order

**Priority Benefits**:
- **Efficient Flow**: Ensures maximum throughput by preventing analysis bottlenecks
- **Resource Optimization**: Prevents analysis tasks from consuming slots when parsing is pending
- **User Experience**: Users see parsing completion faster, enabling immediate analysis start
- **System Stability**: Reduces resource contention between phases

**Priority Implementation**:
```csharp
// Phase 1: Always process parsing first
var availableSlots = maxConcurrentProcessing - currentlyProcessing;
var pendingResumes = await GetPendingResumesAsync(availableSlots);
await ProcessResumesInParallel(pendingResumes);

// Phase 2: Only process analysis with remaining slots
var remainingSlots = maxConcurrentProcessing - currentlyProcessing;
if (remainingSlots > 0)
{
    var pendingAnalyses = await GetPendingAnalysesAsync(remainingSlots);
    await ProcessAnalysesInParallel(pendingAnalyses);
}
```

### Processing Logic

The background service implements **dual-phase processing** with automatic phase transitions:

**Phase 1 - Resume Parsing** (Priority Processing):
1. **Query pending resumes**: Get ResumeContent records with status "pending"
2. **Update status**: Set to "processing"
3. **Download from S3**: Get PDF file using S3Service
4. **Extract text**: Use PdfPig library for text extraction
5. **Structure with AI**: Call Bedrock with parsing-specific configuration (temperature: 0.0, maxTokens: 4096)
6. **Store results**: Update database with structured JSON content
7. **Update status**: Set to "completed" or "failed"
8. **Send notification**: Email user about parsing completion
9. **Trigger analysis**: Completion automatically makes associated ResumeAnalysis eligible for processing

**Phase 2 - ATS Analysis** (Dependent Processing):
1. **Query pending analyses**: Get ResumeAnalysis records with status "waiting_for_parsing"
2. **Dependency check**: Verify corresponding ResumeContent has status "completed"
3. **Skip if not ready**: If parsing incomplete, analysis remains in queue for next cycle
4. **Update status**: Set analysis to "processing" only if parsing is complete
5. **Retrieve parsed content**: Get structured JSON content from ResumeContent record
6. **Analyze with AI**: Call Bedrock with analysis-specific configuration (temperature: 0.2, maxTokens: 8192, topP: 0.9)
7. **Calculate scores**: Apply weighted scoring algorithm across 6 dimensions
8. **Store results**: Update database with detailed analysis results, scores, and recommendations
9. **Update status**: Set to "completed" or "failed"
10. **Send notification**: Email user with ATS score and actionable recommendations

**Phase Coordination**:
- **Automatic Linking**: Each ResumeContent record has a corresponding ResumeAnalysis record created during upload
- **Status Synchronization**: Analysis status automatically reflects parsing progress
- **Error Handling**: Parsing failures prevent analysis from proceeding, maintaining data integrity
- **Resource Management**: Processing slots are allocated with parsing priority to maintain efficient flow

### Phase Relationship and Coordination

**Dependency Management**:
- **One-to-One Relationship**: Each ResumeContent record has exactly one corresponding ResumeAnalysis record
- **Foreign Key Linking**: ResumeAnalysis.resume_content_id references ResumeContent.id
- **Status Coordination**: Analysis cannot proceed until parsing reaches "completed" status
- **Automatic Progression**: No manual intervention required for phase transitions

**Data Flow Between Phases**:
1. **Phase 1 Output → Phase 2 Input**: Structured JSON from parsing becomes input for analysis
2. **Shared Context**: Both phases access the same user context and file metadata
3. **Error Propagation**: Parsing failures prevent analysis from starting
4. **Success Chaining**: Parsing success automatically enables analysis processing

**Processing Coordination**:
- **Sequential Processing**: Analysis waits for parsing completion on the same resume
- **Parallel Processing**: Different resumes can be in different phases simultaneously
- **Priority System**: Parsing tasks are processed before analysis tasks in each polling cycle
- **Resource Sharing**: Both phases share the same Bedrock service but with different configurations

#### Automatic Status Transitions

The background service implements **intelligent automatic status transitions** that coordinate the flow between parsing and analysis phases without manual intervention:

**Status Transition Flow**:
```
Upload → pending → processing → completed → analysis_ready
   ↓         ↓          ↓           ↓            ↓
ResumeContent Status Progression → Triggers Analysis Status Change
   ↓
waiting_for_parsing → processing → completed
         ↓               ↓           ↓
    ResumeAnalysis Status Progression
```

**Automatic Transition Triggers**:

1. **Upload Completion → Parsing Queue**:
   - **Trigger**: Resume upload to S3 completes successfully
   - **Action**: ResumeContent status set to "pending"
   - **Side Effect**: ResumeAnalysis created with status "waiting_for_parsing"
   - **Next Step**: Background service picks up in next polling cycle

2. **Parsing Start → Processing State**:
   - **Trigger**: Background service selects resume for processing
   - **Action**: ResumeContent status updated to "processing"
   - **Side Effect**: Analysis remains in "waiting_for_parsing"
   - **Timing**: Immediate when processing begins

3. **Parsing Success → Analysis Eligibility**:
   - **Trigger**: Resume parsing completes successfully
   - **Action**: ResumeContent status updated to "completed"
   - **Side Effect**: Associated ResumeAnalysis becomes eligible for processing
   - **Next Step**: Analysis will be picked up in subsequent polling cycles

4. **Analysis Start → Processing State**:
   - **Trigger**: Background service finds completed parsing and available slots
   - **Action**: ResumeAnalysis status updated to "processing"
   - **Dependency Check**: Verifies ResumeContent.parsing_status = "completed"
   - **Timing**: Next polling cycle after parsing completion

5. **Analysis Completion → Final State**:
   - **Trigger**: Analysis processing completes (success or failure)
   - **Action**: ResumeAnalysis status updated to "completed" or "failed"
   - **Side Effect**: Email notification sent to user
   - **Final State**: Process complete for this resume

**Status Transition Logic**:
```csharp
// Automatic transition detection in polling cycle
private async Task<List<ResumeAnalysis>> GetReadyAnalysesAsync(int maxCount)
{
    return await _context.ResumeAnalyses
        .Where(ra => ra.Status == "waiting_for_parsing")
        .Where(ra => ra.ResumeContent.ParsingStatus == "completed")
        .OrderBy(ra => ra.CreatedAt)
        .Take(maxCount)
        .ToListAsync();
}

// Status update with automatic progression
private async Task CompleteParsingAsync(ResumeContent resume)
{
    resume.ParsingStatus = "completed";
    resume.ParsedAt = DateTime.UtcNow;
    
    // Automatic trigger: Analysis becomes eligible
    var analysis = await _context.ResumeAnalyses
        .FirstOrDefaultAsync(ra => ra.ResumeContentId == resume.Id);
    
    if (analysis != null && analysis.Status == "waiting_for_parsing")
    {
        // Analysis will be picked up in next polling cycle automatically
        _logger.LogInformation("Resume {ResumeId} parsing completed. Analysis {AnalysisId} now eligible for processing.", 
            resume.Id, analysis.Id);
    }
    
    await _context.SaveChangesAsync();
}
```

**Transition Reliability**:
- **Atomic Updates**: Status changes are wrapped in database transactions
- **Consistency Checks**: Dependency validation before status transitions
- **Error Recovery**: Failed transitions don't corrupt system state
- **Idempotency**: Safe to retry status transitions
- **Audit Trail**: All status changes logged with timestamps

**Transition Monitoring**:
- **Status Tracking**: Real-time monitoring of status progression
- **Stuck Detection**: Identification of resumes stuck in intermediate states
- **Performance Metrics**: Time spent in each status state
- **Error Analysis**: Tracking of failed transitions and their causes

#### Concurrency Management Across Both Phases

The service implements **sophisticated concurrency management** that coordinates resource allocation between parsing and analysis phases:

**Concurrency Configuration**:
- **Max Concurrent Processing**: 3 total slots (configurable via `MaxConcurrentProcessing`)
- **Shared Resource Pool**: Both phases share the same processing slot pool
- **Dynamic Allocation**: Slots are allocated dynamically based on phase priority and availability
- **Real-time Tracking**: Active processing count monitored continuously

**Slot Allocation Strategy**:
1. **Phase 1 Priority**: Parsing tasks get first access to available slots
2. **Remaining Capacity**: Analysis tasks use slots not consumed by parsing
3. **Dynamic Reallocation**: Slots become available as tasks complete
4. **No Reservation**: No slots are reserved exclusively for either phase

**Concurrency Control Implementation**:
```csharp
private async Task ProcessPendingResumesAsync()
{
    var currentlyProcessing = GetCurrentlyProcessingCount();
    var availableSlots = _maxConcurrentProcessing - currentlyProcessing;
    
    if (availableSlots <= 0) return;
    
    var pendingResumes = await GetPendingResumesAsync(availableSlots);
    var tasks = pendingResumes.Select(ProcessResumeAsync);
    await Task.WhenAll(tasks);
}

private async Task ProcessPendingAnalysesAsync()
{
    var currentlyProcessing = GetCurrentlyProcessingCount();
    var availableSlots = _maxConcurrentProcessing - currentlyProcessing;
    
    if (availableSlots <= 0) return;
    
    var pendingAnalyses = await GetReadyAnalysesAsync(availableSlots);
    var tasks = pendingAnalyses.Select(ProcessAnalysisAsync);
    await Task.WhenAll(tasks);
}
```

**Concurrency Benefits**:
- **Resource Efficiency**: Maximum utilization of available processing capacity
- **Scalability**: Easy to adjust concurrent processing limits based on system resources
- **Isolation**: Failures in one task don't affect others
- **Throughput**: Parallel processing significantly reduces overall processing time
- **Flexibility**: Can handle varying workloads (parsing-heavy vs analysis-heavy periods)

**Concurrency Monitoring**:
- **Active Task Tracking**: Real-time count of processing tasks
- **Slot Utilization**: Monitoring of slot usage patterns
- **Performance Metrics**: Processing time and throughput measurements
- **Resource Contention**: Detection of bottlenecks and resource conflicts

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

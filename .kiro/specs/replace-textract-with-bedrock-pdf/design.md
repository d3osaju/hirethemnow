# Design Document

## Overview

This design replaces the current AWS Textract-based text extraction with a .NET PDF parsing library (PdfPig), while continuing to use Amazon Nova Pro for content structuring. The new approach uses a reliable open-source library for PDF text extraction, eliminating Textract's format limitations and providing better error handling.

### Current Architecture Issues
- **Textract limitations**: Doesn't support DOC/DOCX files, fails on certain PDF features
- **Error-prone**: Files with spaces in names, encryption, or certain PDF features fail with generic errors
- **Additional AWS service**: Textract adds complexity and cost
- **Poor error messages**: Generic "unsupported format" errors don't help users

### Proposed Solution
- **PdfPig library**: Reliable, open-source .NET library for PDF text extraction
- **Better format support**: Handles most PDF types including complex layouts
- **Simplified architecture**: Remove Textract dependency, use library instead
- **Improved error handling**: More specific error messages (corrupted, encrypted, etc.)
- **Keep Nova Pro**: Continue using existing Bedrock model for structuring
- **No new AWS access needed**: Works with current permissions

## Architecture

### High-Level Flow

```
┌─────────────┐
│   Upload    │
│   Resume    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Store in   │
│     S3      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Database   │
│  (pending)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Background Service  │
│ (polls every 10s)   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Download PDF from   │
│       S3            │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Extract text using  │
│ PdfPig library      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Send text to        │
│ Bedrock Nova Pro    │
│ for structuring     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Nova structures     │
│ text into JSON      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Store structured    │
│ content in DB       │
│ (completed/failed)  │
└─────────────────────┘
```

### Component Changes

#### 1. BedrockAgentService
**Current**: Uses Textract for extraction, then Bedrock for structuring
**New**: Uses PdfPig library for extraction, then Nova for structuring

**Key Changes**:
- Replace `ExtractTextFromDocumentAsync()` with `ExtractTextFromPdfAsync()` using PdfPig
- Remove `IAmazonTextract` dependency
- Add PdfPig NuGet package dependency
- Add `DownloadDocumentFromS3Async()` method
- Modify `ParseAndStructureResumeAsync()` to use PdfPig instead of Textract
- Keep `StructureResumeWithClaudeAsync()` (already works with Nova)

#### 2. Program.cs
**Current**: Registers both Textract and Bedrock clients
**New**: Only registers Bedrock client

**Key Changes**:
- Remove `IAmazonTextract` service registration
- Keep `IAmazonBedrockRuntime` service registration
- Add `IAmazonS3` client for downloading documents

#### 3. Configuration (appsettings.json)
**Current**: Uses `amazon.nova-pro-v1:0` model
**New**: Keep using `amazon.nova-pro-v1:0` model (no change needed)

**Key Changes**:
- Keep `ResumeParsing:BedrockModelId` as `amazon.nova-pro-v1:0`
- Remove Textract-related configuration
- Add document size limits configuration
- No Bedrock model changes required

#### 4. IAM Permissions (deploy-backend.ps1)
**Current**: Grants both Textract and Bedrock permissions
**New**: Only grants Bedrock and S3 permissions

**Key Changes**:
- Remove Textract permissions from IAM policy
- Keep Bedrock InvokeModel permission
- Ensure S3 GetObject permission for downloading documents

## Components and Interfaces

### Modified Interface: IBedrockAgentService

```csharp
public interface IBedrockAgentService
{
    // Existing methods remain unchanged
    Task<ResumeAnalysisResult> AnalyzeResumeAsync(string userId);
    Task<ResumeAnalysisResult?> GetLatestAnalysisAsync(string userId);
    Task CreatePendingAnalysisAsync(string userId, string s3Url);
    Task StoreResumeAnalysisAsync(ResumeAnalysisData data);
    
    // Modified method - signature remains the same but implementation changes
    Task<ParsedResumeResult> ParseAndStructureResumeAsync(string s3Url);
}
```

### New Internal Methods in BedrockAgentService

```csharp
// Downloads document from S3 as byte array
private async Task<byte[]> DownloadDocumentFromS3Async(string bucketName, string objectKey);

// Extracts text from PDF using PdfPig library (replaces ExtractTextFromDocumentAsync)
private string ExtractTextFromPdfAsync(byte[] pdfBytes, string fileName);

// Determines appropriate error message based on exception type
private string GetUserFriendlyErrorMessage(Exception ex, string fileName);
```

### PdfPig Usage Example

```csharp
using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;

private string ExtractTextFromPdfAsync(byte[] pdfBytes, string fileName)
{
    try
    {
        using var document = PdfDocument.Open(pdfBytes);
        var textBuilder = new StringBuilder();
        
        foreach (Page page in document.GetPages())
        {
            textBuilder.AppendLine(page.Text);
        }
        
        return textBuilder.ToString();
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to extract text from PDF: {FileName}", fileName);
        throw;
    }
}
```

### Nova Pro Request Format (Unchanged)

The existing Nova Pro request format continues to work:

```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "text": "Extract and structure this resume into JSON format: {resume_text}"
        }
      ]
    }
  ],
  "inferenceConfig": {
    "max_new_tokens": 4096,
    "temperature": 0.7
  }
}
```

## Data Models

### No Changes Required
The existing data models remain unchanged:
- `ResumeContent` - Database model for resume records
- `ParsedResumeResult` - Return type for parsing operations
- `StructuredResumeContent` - Structured resume data
- All related DTOs and models

### Configuration Model

```csharp
// appsettings.json structure
{
  "ResumeParsing": {
    "BedrockModelId": "amazon.nova-pro-v1:0",  // Keep existing Nova Pro
    "MaxFileSizeBytes": 5242880,  // 5MB
    "ParsingTimeoutSeconds": 30,
    "SupportedFormats": ["pdf"],  // Only PDF for now
    "EnableBackgroundProcessing": true,
    "PollingIntervalSeconds": 10,
    "MaxConcurrentProcessing": 3
  },
  "AWS": {
    "S3": {
      "BucketName": "hirethemnow-files"
    }
  }
}
```

### NuGet Package Dependencies

Add to `HireThemNoW.Server.csproj`:

```xml
<PackageReference Include="PdfPig" Version="0.1.9" />
```

## Error Handling

### Error Categories and Messages

#### 1. File Format Errors
**Trigger**: Unsupported file extension or MIME type
**User Message**: "Only PDF files are currently supported. Please upload your resume as a PDF."
**Technical Log**: File extension, MIME type, file name

#### 2. File Size Errors
**Trigger**: File exceeds 5MB limit
**User Message**: "The file is too large. Please upload a PDF file smaller than 5MB."
**Technical Log**: File size, limit, file name

#### 3. Corrupted/Encrypted PDF
**Trigger**: Bedrock returns validation error
**User Message**: "The PDF file appears to be corrupted or password-protected. Please upload an unprotected PDF."
**Technical Log**: Bedrock error code, file name

#### 4. Bedrock Service Errors
**Trigger**: Bedrock API errors (throttling, service unavailable)
**User Message**: "Resume parsing service is temporarily unavailable. Please try again in a few moments."
**Technical Log**: HTTP status code, error code, retry-after header

#### 5. S3 Download Errors
**Trigger**: Cannot download file from S3
**User Message**: "Unable to access the uploaded file. Please try uploading again."
**Technical Log**: S3 error, bucket, key

#### 6. Parsing Timeout
**Trigger**: Bedrock takes longer than 30 seconds
**User Message**: "The resume is taking too long to process. Please try a simpler PDF format."
**Technical Log**: Elapsed time, timeout threshold

### Error Handling Flow

```csharp
try
{
    // Download from S3
    var documentBytes = await DownloadDocumentFromS3Async(bucket, key);
    
    // Validate file size
    if (documentBytes.Length > maxFileSize)
    {
        return new ParsedResumeResult
        {
            Success = false,
            ErrorMessage = "The file is too large. Please upload a PDF file smaller than 5MB."
        };
    }
    
    // Parse with Bedrock
    var result = await ParsePdfWithBedrockAsync(documentBytes, fileName);
    
    return new ParsedResumeResult
    {
        Success = true,
        StructuredContent = result
    };
}
catch (AmazonBedrockRuntimeException ex) when (ex.StatusCode == HttpStatusCode.BadRequest)
{
    _logger.LogError(ex, "Bedrock rejected PDF: {FileName}", fileName);
    return new ParsedResumeResult
    {
        Success = false,
        ErrorMessage = "The PDF file appears to be corrupted or password-protected."
    };
}
catch (AmazonS3Exception ex)
{
    _logger.LogError(ex, "Failed to download from S3: {Bucket}/{Key}", bucket, key);
    return new ParsedResumeResult
    {
        Success = false,
        ErrorMessage = "Unable to access the uploaded file. Please try uploading again."
    };
}
catch (TimeoutException ex)
{
    _logger.LogError(ex, "Bedrock parsing timeout for: {FileName}", fileName);
    return new ParsedResumeResult
    {
        Success = false,
        ErrorMessage = "The resume is taking too long to process."
    };
}
```

## Testing Strategy

### Unit Tests

#### 1. BedrockAgentService Tests
- **Test**: `ParsePdfWithBedrockAsync_ValidPdf_ReturnsStructuredContent`
  - Mock Bedrock response with valid structured data
  - Verify correct parsing and deserialization

- **Test**: `ParsePdfWithBedrockAsync_InvalidPdf_ThrowsException`
  - Mock Bedrock BadRequest response
  - Verify appropriate error handling

- **Test**: `DownloadDocumentFromS3Async_ValidKey_ReturnsBytes`
  - Mock S3 GetObject response
  - Verify document download

- **Test**: `DownloadDocumentFromS3Async_InvalidKey_ThrowsException`
  - Mock S3 NoSuchKey error
  - Verify error handling

#### 2. Error Message Tests
- **Test**: `GetUserFriendlyErrorMessage_BedrockBadRequest_ReturnsCorruptedMessage`
- **Test**: `GetUserFriendlyErrorMessage_S3Error_ReturnsAccessMessage`
- **Test**: `GetUserFriendlyErrorMessage_Timeout_ReturnsTimeoutMessage`

### Integration Tests

#### 1. End-to-End Parsing Test
- Upload a real PDF resume to S3
- Trigger parsing via background service
- Verify structured content in database
- Verify status updates (pending → processing → completed)

#### 2. Error Scenario Tests
- **Test**: Upload encrypted PDF, verify "corrupted/protected" error
- **Test**: Upload oversized file, verify size limit error
- **Test**: Upload non-PDF file, verify format error

#### 3. Performance Tests
- **Test**: Parse 10 resumes concurrently, verify all complete within 60 seconds
- **Test**: Verify parsing time is less than previous Textract+Bedrock approach

### Manual Testing Checklist

- [ ] Upload simple text-based PDF resume
- [ ] Upload complex multi-page PDF resume
- [ ] Upload PDF with images
- [ ] Upload PDF with special characters
- [ ] Upload PDF with non-English text
- [ ] Upload encrypted/password-protected PDF (should fail gracefully)
- [ ] Upload corrupted PDF (should fail gracefully)
- [ ] Upload file larger than 5MB (should fail gracefully)
- [ ] Verify error messages are user-friendly
- [ ] Verify logs contain technical details for debugging

## Deployment Strategy

### Phase 1: Preparation
1. Update configuration to use Claude 3 Sonnet model ID
2. Update IAM policy to remove Textract permissions
3. Deploy code changes to staging environment
4. Run integration tests on staging

### Phase 2: Production Deployment
1. Deploy updated backend code
2. Monitor CloudWatch logs for errors
3. Test with sample resumes
4. Monitor parsing success rate

### Phase 3: Rollback Plan
If issues occur:
1. Revert to previous deployment
2. Restore Textract-based parsing
3. Investigate issues in staging
4. Fix and redeploy

### Monitoring

**Key Metrics to Track**:
- Parsing success rate (target: >95%)
- Average parsing time (target: <10 seconds)
- Error rate by error type
- Bedrock API latency
- S3 download latency

**CloudWatch Alarms**:
- Alert if parsing success rate drops below 90%
- Alert if average parsing time exceeds 15 seconds
- Alert if error rate exceeds 10%

## Performance Considerations

### Expected Performance Improvements
- **Latency**: Reduced from ~2-3 seconds (Textract + Bedrock) to ~1-2 seconds (Bedrock only)
- **Reliability**: Fewer points of failure (one service instead of two)
- **Cost**: Potentially lower (one API call instead of two)

### File Size Limits
- **Maximum file size**: 5MB (configurable)
- **Bedrock limit**: Claude 3 supports up to 10MB documents
- **S3 download timeout**: 30 seconds

### Concurrent Processing
- **Max concurrent**: 3 resumes (unchanged)
- **Polling interval**: 10 seconds (unchanged)
- **Background service**: Continues to run as before

## Security Considerations

### IAM Permissions
**Required permissions**:
- `bedrock:InvokeModel` on Nova Pro model ARN (already have this)
- `s3:GetObject` on hirethemnow-files bucket (already have this)
- `s3:PutObject` on hirethemnow-files bucket (already have this)

**Removed permissions**:
- `textract:DetectDocumentText` (no longer needed)
- `textract:AnalyzeDocument` (no longer needed)

**No new permissions needed** - works with existing access!

### Data Privacy
- PDF documents are downloaded temporarily into memory
- Documents are not stored locally on disk
- Documents are processed and immediately discarded
- Only structured data is persisted in database

### API Security
- Bedrock API calls use AWS IAM authentication
- S3 downloads use IAM role credentials
- No API keys or secrets in code

## Migration Notes

### Backward Compatibility
- Existing parsed resumes remain unchanged
- Database schema unchanged
- API endpoints unchanged
- Frontend unchanged

### Configuration Changes
Update `appsettings.json`:
```json
{
  "ResumeParsing": {
    "BedrockModelId": "amazon.nova-pro-v1:0",  // No change needed
    "SupportedFormats": ["pdf"]
  }
}
```

### Package Changes
Add PdfPig NuGet package:
```bash
dotnet add package PdfPig --version 0.1.9
```

### Deployment Script Changes
Update `deploy-backend.ps1`:
- Remove Textract permission configuration
- Keep Bedrock and S3 permissions
- Update model ID in environment variables if needed

### No Database Migration Required
The database schema remains unchanged, so no migration scripts are needed.

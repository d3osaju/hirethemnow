# AWS Bedrock Integration Guide

## Overview

The resume parsing system now uses **AWS Bedrock** (Claude 3) and **AWS Textract** to extract and structure resume content from PDF, DOC, and DOCX files.

## Architecture

```
Resume File (S3)
    ↓
AWS Textract (Text Extraction)
    ↓
Plain Text
    ↓
AWS Bedrock (Claude 3 - Structuring)
    ↓
Structured JSON
    ↓
Database (ResumeContents table)
```

## Components

### 1. AWS Textract
**Purpose**: Extract text from PDF/DOC/DOCX files

**API Used**: `DetectDocumentText`

**Input**: S3 bucket and object key

**Output**: Plain text with line breaks preserved

**Example**:
```
John Doe
john.doe@email.com | +1-234-567-8900
San Francisco, CA

EXPERIENCE
Software Engineer at Tech Corp
January 2020 - Present
- Built scalable microservices...
```

### 2. AWS Bedrock (Claude 3)
**Purpose**: Structure extracted text into JSON format

**Model**: `anthropic.claude-3-sonnet-20240229-v1:0` (configurable)

**Input**: Plain text from Textract

**Output**: Structured JSON matching `StructuredResumeContent` model

**Example Output**:
```json
{
  "personalInfo": {
    "name": "John Doe",
    "email": "john.doe@email.com",
    "phone": "+1-234-567-8900",
    "location": "San Francisco, CA"
  },
  "experience": [
    {
      "company": "Tech Corp",
      "title": "Software Engineer",
      "startDate": "2020-01",
      "endDate": "Present",
      "description": "Built scalable microservices",
      "achievements": ["Reduced latency by 40%"]
    }
  ],
  "skills": {
    "technical": ["Python", "AWS", "Docker"],
    "soft": ["Leadership", "Communication"]
  }
}
```

## Implementation Details

### BedrockAgentService.cs

#### Main Method: `ParseAndStructureResumeAsync(string s3Url)`

**Flow**:
1. Validate S3 URL format
2. Parse bucket name and object key
3. Call `ExtractTextFromDocumentAsync()` - Uses Textract
4. Call `StructureResumeWithClaudeAsync()` - Uses Bedrock
5. Return `ParsedResumeResult`

#### Text Extraction: `ExtractTextFromDocumentAsync()`

```csharp
private async Task<string> ExtractTextFromDocumentAsync(string bucketName, string objectKey)
{
    var request = new DetectDocumentTextRequest
    {
        Document = new Document
        {
            S3Object = new S3Object
            {
                Bucket = bucketName,
                Name = objectKey
            }
        }
    };

    var response = await _textractClient.DetectDocumentTextAsync(request);

    // Extract LINE blocks (preserves document structure)
    var textBuilder = new StringBuilder();
    foreach (var block in response.Blocks)
    {
        if (block.BlockType == BlockType.LINE)
        {
            textBuilder.AppendLine(block.Text);
        }
    }

    return textBuilder.ToString();
}
```

**Key Points**:
- Uses `DetectDocumentText` (simpler, faster than `AnalyzeDocument`)
- Extracts only LINE blocks (ignores WORD and PAGE blocks)
- Preserves line structure for better Claude parsing

#### Content Structuring: `StructureResumeWithClaudeAsync()`

```csharp
private async Task<StructuredResumeContent> StructureResumeWithClaudeAsync(string plainText)
{
    // 1. Build prompt with JSON schema
    var prompt = $@"You are a resume parsing assistant...
    
    Resume Text:
    {plainText}
    
    Return ONLY a valid JSON object with this structure:
    {{ ... }}";

    // 2. Create Bedrock request
    var requestBody = new
    {
        anthropic_version = "bedrock-2023-05-31",
        max_tokens = 4096,
        messages = new[]
        {
            new { role = "user", content = prompt }
        }
    };

    // 3. Invoke Bedrock
    var response = await _bedrockClient.InvokeModelAsync(invokeRequest);

    // 4. Parse Claude's response
    var claudeResponse = JsonSerializer.Deserialize<ClaudeResponse>(responseBody);
    var contentText = claudeResponse.Content[0].Text;

    // 5. Clean markdown code blocks if present
    contentText = RemoveMarkdownCodeBlocks(contentText);

    // 6. Deserialize to StructuredResumeContent
    return JsonSerializer.Deserialize<StructuredResumeContent>(contentText);
}
```

**Key Points**:
- Uses Claude 3 Sonnet (good balance of speed/quality)
- Provides explicit JSON schema in prompt
- Handles markdown code blocks (```json)
- Case-insensitive deserialization

## Configuration

### appsettings.json

```json
{
  "ResumeParsing": {
    "BedrockModelId": "anthropic.claude-3-sonnet-20240229-v1:0",
    "ParsingTimeoutSeconds": 30
  }
}
```

### AWS IAM Permissions Required

The application needs these IAM permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "textract:DetectDocumentText"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::hirethemnow-files/*"
    }
  ]
}
```

### Environment Variables

For production deployment, ensure these are set:
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (e.g., `us-east-1`)

Or use IAM roles (recommended for EC2/ECS/Lambda).

## Structured Content Schema

### StructuredResumeContent Model

```csharp
public class StructuredResumeContent
{
    public PersonalInfo? PersonalInfo { get; set; }
    public string? Summary { get; set; }
    public List<Experience>? Experience { get; set; }
    public List<Education>? Education { get; set; }
    public Skills? Skills { get; set; }
    public List<string>? Certifications { get; set; }
    public List<Project>? Projects { get; set; }
}

public class PersonalInfo
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Location { get; set; }
    public string? LinkedIn { get; set; }
    public string? Website { get; set; }
}

public class Experience
{
    public string? Company { get; set; }
    public string? Title { get; set; }
    public string? Location { get; set; }
    public string? StartDate { get; set; }
    public string? EndDate { get; set; }
    public string? Description { get; set; }
    public List<string>? Achievements { get; set; }
}

public class Education
{
    public string? Institution { get; set; }
    public string? Degree { get; set; }
    public string? Field { get; set; }
    public string? GraduationDate { get; set; }
    public string? Gpa { get; set; }
}

public class Skills
{
    public List<string>? Technical { get; set; }
    public List<string>? Soft { get; set; }
    public List<string>? Languages { get; set; }
    public List<string>? Tools { get; set; }
}

public class Project
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public List<string>? Technologies { get; set; }
    public string? Url { get; set; }
}
```

## Error Handling

### Common Errors

#### 1. Textract Errors
**Error**: `AccessDeniedException`
**Cause**: Missing IAM permissions for Textract
**Solution**: Add `textract:DetectDocumentText` permission

**Error**: `InvalidS3ObjectException`
**Cause**: File not found in S3 or invalid format
**Solution**: Verify S3 key and file format

#### 2. Bedrock Errors
**Error**: `AccessDeniedException`
**Cause**: Missing IAM permissions for Bedrock
**Solution**: Add `bedrock:InvokeModel` permission

**Error**: `ModelNotReadyException`
**Cause**: Model not available in region
**Solution**: Check model availability in your AWS region

**Error**: `ThrottlingException`
**Cause**: Too many requests
**Solution**: Implement exponential backoff or request quota increase

#### 3. Parsing Errors
**Error**: Empty text extracted
**Cause**: Unsupported file format or corrupted file
**Solution**: Validate file before upload

**Error**: Invalid JSON from Claude
**Cause**: Claude returned malformed JSON
**Solution**: Improve prompt or add retry logic

## Performance Metrics

### Typical Processing Times

| Step | Average Time | Notes |
|------|--------------|-------|
| Textract extraction | 2-5 seconds | Depends on document size |
| Claude structuring | 3-8 seconds | Depends on content complexity |
| **Total** | **5-13 seconds** | End-to-end parsing |

### Optimization Tips

1. **Use Textract DetectDocumentText** (not AnalyzeDocument)
   - Faster and cheaper
   - Sufficient for resume parsing

2. **Optimize Claude prompt**
   - Clear, concise instructions
   - Explicit JSON schema
   - Request minimal tokens

3. **Implement caching**
   - Cache parsed results by file hash
   - Avoid re-parsing identical files

4. **Batch processing**
   - Process multiple resumes concurrently
   - Use background service (already implemented)

## Cost Estimation

### AWS Pricing (as of 2025)

**Textract**:
- DetectDocumentText: $1.50 per 1,000 pages
- Average resume: 1-3 pages
- Cost per resume: ~$0.0015 - $0.0045

**Bedrock (Claude 3 Sonnet)**:
- Input: $0.003 per 1K tokens
- Output: $0.015 per 1K tokens
- Average resume: ~2K input tokens, ~1K output tokens
- Cost per resume: ~$0.006 + $0.015 = $0.021

**Total Cost per Resume**: ~$0.023 ($23 per 1,000 resumes)

## Testing

### Local Testing

1. **Upload a test resume**:
```bash
curl -X POST https://api.hirethemnow.xyz/api/resume/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "resume=@test-resume.pdf"
```

2. **Check parsing status**:
```bash
curl https://api.hirethemnow.xyz/api/resume/parsing-status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

3. **Get parsed content**:
```bash
curl https://api.hirethemnow.xyz/api/resume/content \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Cases

1. **Simple resume** (1 page, basic formatting)
2. **Complex resume** (3+ pages, multiple sections)
3. **PDF with images** (should extract text only)
4. **DOC/DOCX files** (test different formats)
5. **Non-English resumes** (test language support)
6. **Corrupted files** (test error handling)

## Monitoring

### CloudWatch Metrics

Monitor these metrics:
- Textract API calls
- Bedrock API calls
- Error rates
- Processing times
- Cost per day

### Logs to Watch

```
[Information] Starting text extraction from document using Textract
[Information] Text extraction completed in 3.45s, extracted 2,456 characters
[Information] Starting content structuring with Claude via Bedrock
[Information] Content structuring completed in 5.23s
[Information] Resume parsing completed successfully in 8.68s
```

## Troubleshooting

### Issue: Parsing takes too long
**Solution**: 
- Check document size (large PDFs take longer)
- Verify network connectivity to AWS
- Check CloudWatch for throttling

### Issue: Extracted text is garbled
**Solution**:
- Verify file is not corrupted
- Check file encoding
- Try re-uploading the file

### Issue: Claude returns incomplete JSON
**Solution**:
- Increase `max_tokens` in Bedrock request
- Simplify the prompt
- Use Claude 3 Opus for better quality (more expensive)

### Issue: High costs
**Solution**:
- Implement caching for duplicate files
- Use Claude 3 Haiku for simpler resumes (cheaper)
- Batch process during off-peak hours

## Future Enhancements

1. **Multi-language support**: Detect and parse resumes in different languages
2. **Resume scoring**: Add ATS scoring based on parsed content
3. **Skills matching**: Match resume skills with job requirements
4. **Resume comparison**: Compare multiple resumes side-by-side
5. **Export formats**: Export parsed data to PDF, Word, JSON
6. **Batch upload**: Upload and parse multiple resumes at once
7. **Resume templates**: Generate formatted resumes from structured data

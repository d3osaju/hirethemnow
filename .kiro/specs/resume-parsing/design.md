# Design Document

## Overview

This design implements automatic resume parsing functionality that extracts structured content from uploaded resumes and stores it in a usable JSON format. The system will parse PDF, DOC, and DOCX files, extract text content, use AI to structure the information, and store both the structured JSON and plain text in the database.

The design leverages existing infrastructure (S3 for storage, AWS Bedrock for AI processing) and integrates seamlessly with the current resume upload workflow.

## Architecture

### High-Level Flow

```
User Uploads Resume
    ↓
ResumeController.UploadResume()
    ↓
S3Service.UploadFileAsync() → Store file in S3
    ↓
ResumeParsingService.ParseResumeAsync() → Trigger parsing
    ↓
BedrockAgentService.ParseAndStructureResumeAsync() → AI extracts and structures content
    ↓
DataService.SaveResumeContentAsync() → Store in database
    ↓
Return success response with parsing status
```

### Component Diagram

```
┌─────────────────────┐
│  ResumeController   │
└──────────┬──────────┘
           │
           ├──────────────────────────────────┐
           │                                  │
           ▼                                  ▼
┌─────────────────────┐          ┌─────────────────────┐
│    S3Service        │          │ ResumeParsingService│
└─────────────────────┘          └──────────┬──────────┘
                                            │
                                            ▼
                                  ┌─────────────────────┐
                                  │  BedrockService     │
                                  │  (Document Parse +  │
                                  │   AI Structure)     │
                                  └──────────┬──────────┘
                                            │
                                            ▼
                                  ┌─────────────────────┐
                                  │    DataService      │
                                  └─────────────────────┘
                                            │
                                            ▼
                                  ┌─────────────────────┐
                                  │  PostgreSQL DB      │
                                  │ (resume_contents)   │
                                  └─────────────────────┘
```

## Components and Interfaces

### 1. ResumeContent Model (Already Exists)

The existing `ResumeContent` model already has the necessary structure. No changes needed.

**Location:** `HireThemNoW.Server/Models/ResumeContent.cs`

### 2. IResumeParsingService Interface

**Location:** `HireThemNoW.Server/Services/IResumeParsingService.cs`

```csharp
public interface IResumeParsingService
{
    Task<ResumeContent> ParseResumeAsync(string userId, string s3Key, string fileName, string contentType, long fileSizeBytes);
    Task<ResumeContent?> GetLatestResumeContentAsync(string userId);
    Task<List<ResumeContent>> GetResumeHistoryAsync(string userId);
}
```

### 3. ResumeParsingService Implementation

**Location:** `HireThemNoW.Server/Services/ResumeParsingService.cs`

**Responsibilities:**
- Orchestrate the parsing workflow
- Provide S3 file location to Bedrock
- Call Bedrock service to parse and structure content
- Save to database
- Handle errors and update status

**Key Methods:**
- `ParseResumeAsync()` - Main orchestration method
- `GetLatestResumeContentAsync()` - Retrieve latest parsed content
- `GetResumeHistoryAsync()` - Get all versions for a user

### 4. Enhanced IBedrockAgentService Interface

**Location:** `HireThemNoW.Server/Services/IBedrockAgentService.cs`

Add new method:

```csharp
Task<ParsedResumeResult> ParseAndStructureResumeAsync(string s3Url);
```

**Implementation Approach:**

AWS Bedrock can directly process documents from S3 using:
1. **Amazon Textract** integration for document text extraction
2. **Claude 3** or other foundation models for intelligent structuring

The Bedrock service will:
- Accept S3 URL of the resume file
- Use Textract to extract text from PDF/DOC/DOCX
- Use Claude to analyze and structure the content into JSON
- Return both plain text and structured JSON

**Benefits:**
- No need for separate parsing libraries (PdfPig, OpenXml, NPOI)
- Handles all document formats natively
- Better text extraction quality (handles tables, columns, formatting)
- Single API call for extraction + structuring
- Leverages existing AWS infrastructure

### 5. ParsedResumeResult Model

**Location:** `HireThemNoW.Server/Models/ParsedResumeResult.cs`

```csharp
public class ParsedResumeResult
{
    public string PlainText { get; set; } = string.Empty;
    public StructuredResumeContent StructuredContent { get; set; } = new();
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
}
```

### 6. ResumeController Enhancements

**Location:** `HireThemNoW.Server/Controllers/ResumeController.cs`

**New/Modified Endpoints:**

1. **POST /api/resume/upload** (modify existing)
   - Add call to `ResumeParsingService.ParseResumeAsync()` after S3 upload
   - Return parsing status in response

2. **GET /api/resume/content** (new)
   - Retrieve latest parsed resume content
   - Return structured JSON

3. **GET /api/resume/content/history** (new)
   - Retrieve all parsed versions
   - Return array of resume content records

4. **GET /api/resume/parsing-status** (new)
   - Check current parsing status
   - Return status and progress information

### 7. Database Context Updates

**Location:** `HireThemNoW.Server/Data/ApplicationDbContext.cs`

Add DbSet and configuration:

```csharp
public DbSet<ResumeContent> ResumeContents { get; set; }

// In OnModelCreating:
modelBuilder.Entity<ResumeContent>(entity =>
{
    entity.HasKey(e => e.Id);
    entity.Property(e => e.UserId).IsRequired();
    entity.HasIndex(e => e.UserId);
    entity.HasIndex(e => new { e.UserId, e.UploadedAt });
    entity.HasOne(e => e.User)
        .WithMany()
        .HasForeignKey(e => e.UserId)
        .OnDelete(DeleteBehavior.Cascade);
});
```

### 8. IDataService Interface Enhancement

**Location:** `HireThemNoW.Server/Services/IDataService.cs`

Add methods:

```csharp
Task<ResumeContent> SaveResumeContentAsync(ResumeContent content);
Task<ResumeContent?> GetLatestResumeContentAsync(string userId);
Task<List<ResumeContent>> GetResumeContentHistoryAsync(string userId);
Task UpdateResumeContentStatusAsync(int id, string status, string? error = null);
```

## Data Models

### StructuredResumeContent (DTO for AI Response)

**Location:** `HireThemNoW.Server/Models/StructuredResumeContent.cs`

```csharp
public class StructuredResumeContent
{
    public PersonalInformation? PersonalInfo { get; set; }
    public List<WorkExperience>? Experience { get; set; }
    public List<Education>? Education { get; set; }
    public SkillsSection? Skills { get; set; }
    public List<Certification>? Certifications { get; set; }
    public string? Summary { get; set; }
    public List<Project>? Projects { get; set; }
}

public class PersonalInformation
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Location { get; set; }
    public string? LinkedIn { get; set; }
    public string? Portfolio { get; set; }
    public string? GitHub { get; set; }
}

public class WorkExperience
{
    public string? Company { get; set; }
    public string? Title { get; set; }
    public string? StartDate { get; set; }
    public string? EndDate { get; set; }
    public bool IsCurrent { get; set; }
    public string? Location { get; set; }
    public string? Description { get; set; }
    public List<string>? Achievements { get; set; }
    public List<string>? Technologies { get; set; }
}

public class Education
{
    public string? Institution { get; set; }
    public string? Degree { get; set; }
    public string? Field { get; set; }
    public string? StartDate { get; set; }
    public string? EndDate { get; set; }
    public string? GPA { get; set; }
    public List<string>? Honors { get; set; }
}

public class SkillsSection
{
    public List<string>? Technical { get; set; }
    public List<string>? Soft { get; set; }
    public List<string>? Languages { get; set; }
    public List<string>? Tools { get; set; }
}

public class Certification
{
    public string? Name { get; set; }
    public string? Issuer { get; set; }
    public string? Date { get; set; }
    public string? ExpirationDate { get; set; }
    public string? CredentialId { get; set; }
}

public class Project
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public List<string>? Technologies { get; set; }
    public string? Link { get; set; }
    public string? GitHub { get; set; }
}
```

### JSON Storage Format

The `parsed_content` column will store JSON in this format:

```json
{
  "personalInfo": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-0123",
    "location": "San Francisco, CA",
    "linkedin": "linkedin.com/in/johndoe",
    "portfolio": "johndoe.com",
    "github": "github.com/johndoe"
  },
  "experience": [
    {
      "company": "Tech Corp",
      "title": "Senior Software Engineer",
      "startDate": "2020-01",
      "endDate": "2024-12",
      "isCurrent": true,
      "location": "San Francisco, CA",
      "description": "Led development of microservices architecture",
      "achievements": [
        "Reduced API latency by 40%",
        "Mentored 5 junior developers"
      ],
      "technologies": ["C#", "React", "AWS", "PostgreSQL"]
    }
  ],
  "education": [
    {
      "institution": "University of California",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "startDate": "2012-09",
      "endDate": "2016-05",
      "gpa": "3.8",
      "honors": ["Magna Cum Laude", "Dean's List"]
    }
  ],
  "skills": {
    "technical": ["C#", "JavaScript", "Python", "SQL"],
    "soft": ["Leadership", "Communication", "Problem Solving"],
    "languages": ["English", "Spanish"],
    "tools": ["Visual Studio", "Git", "Docker", "AWS"]
  },
  "certifications": [
    {
      "name": "AWS Certified Solutions Architect",
      "issuer": "Amazon Web Services",
      "date": "2023-06",
      "expirationDate": "2026-06",
      "credentialId": "ABC123"
    }
  ],
  "summary": "Experienced software engineer with 8+ years...",
  "projects": [
    {
      "name": "E-commerce Platform",
      "description": "Built scalable e-commerce solution",
      "technologies": ["React", "Node.js", "MongoDB"],
      "link": "https://example.com",
      "github": "github.com/johndoe/ecommerce"
    }
  ]
}
```

## Error Handling

### Error Scenarios

1. **File Download Failure**
   - Status: "failed"
   - Error: "Failed to download file from S3"
   - Action: Log error, notify user

2. **Text Extraction Failure**
   - Status: "failed"
   - Error: "Failed to extract text from document"
   - Action: Log error with file details, notify user

3. **AI Structuring Failure**
   - Status: "failed"
   - Error: "Failed to structure resume content"
   - Action: Store plain text anyway, log error

4. **Database Save Failure**
   - Status: "failed"
   - Error: "Failed to save parsed content"
   - Action: Log error, retry once

5. **Unsupported File Format**
   - Status: "failed"
   - Error: "Unsupported file format"
   - Action: Return error immediately

### Error Response Format

```json
{
  "success": false,
  "message": "Resume parsing failed",
  "error": "Failed to extract text from document",
  "parsingStatus": "failed",
  "canRetry": true
}
```

## Testing Strategy

### Unit Tests

1. **ResumeParsingService Tests**
   - Test successful parsing workflow
   - Test error handling at each stage
   - Test status updates
   - Mock S3, DocumentParser, and Bedrock services

2. **BedrockAgentService Tests**
   - Test document parsing with sample S3 URLs
   - Test AI structuring with various resume formats
   - Test handling of incomplete information
   - Test JSON serialization/deserialization
   - Mock Bedrock API responses

### Integration Tests

1. **End-to-End Resume Upload and Parsing**
   - Upload sample resume
   - Verify parsing triggered
   - Verify content stored in database
   - Verify status updates

2. **Resume Content Retrieval**
   - Upload and parse resume
   - Retrieve content via API
   - Verify JSON structure

3. **Resume Update and Re-parsing**
   - Upload initial resume
   - Upload updated resume
   - Verify new parsing record created
   - Verify history maintained

### Test Data

Create sample resumes in test fixtures:
- `sample-resume.pdf` - Well-formatted PDF resume
- `sample-resume.docx` - Well-formatted DOCX resume
- `complex-resume.pdf` - Multi-page resume with tables
- `minimal-resume.pdf` - Minimal information resume
- `corrupted-file.pdf` - Corrupted file for error testing

## Performance Considerations

### Asynchronous Processing

- All parsing operations are async to avoid blocking
- Use background tasks for long-running parsing
- Consider implementing a queue system for high volume

### Caching

- Cache parsed content in memory for frequently accessed resumes
- Use Redis if scaling to multiple instances

### Database Optimization

- Index on `user_id` and `uploaded_at` for fast queries
- Consider partitioning if table grows very large
- Use JSONB column type in PostgreSQL for efficient JSON queries

### File Size Limits

- Current limit: 5MB (already enforced)
- Parsing timeout: 30 seconds
- If timeout occurs, mark as failed and allow retry

## Security Considerations

### Data Privacy

- Resume content contains PII (Personally Identifiable Information)
- Ensure proper access controls (user can only access their own content)
- Consider encryption at rest for sensitive fields
- Comply with GDPR/CCPA for data deletion

### Input Validation

- Validate file types before parsing
- Sanitize extracted text to prevent injection attacks
- Limit text length to prevent DoS attacks

### API Security

- All endpoints require authentication
- Rate limiting on parsing endpoints
- Validate user ownership before returning content

## Deployment Considerations

### AWS SDK Packages (Already Included)

The project already has the necessary AWS SDK packages:
- `AWSSDK.Extensions.NETCore.Setup`
- AWS Bedrock client (may need to add if not present)

If Bedrock SDK is not included, add:

```xml
<PackageReference Include="AWSSDK.BedrockRuntime" Version="3.7.x" />
```

**Note:** No additional document parsing libraries needed since Bedrock handles document extraction natively.

### Database Migration

Create migration to add `resume_contents` table:

```bash
dotnet ef migrations add AddResumeContentTable
dotnet ef database update
```

### Configuration

Add to `appsettings.json`:

```json
{
  "ResumeParsing": {
    "MaxFileSizeBytes": 5242880,
    "ParsingTimeoutSeconds": 30,
    "SupportedFormats": ["pdf", "docx", "doc"],
    "EnableBackgroundProcessing": true
  }
}
```

### Monitoring

- Log parsing success/failure rates
- Monitor parsing duration
- Alert on high failure rates
- Track storage usage for parsed content

## Future Enhancements

1. **Background Processing Queue**
   - Use AWS SQS for asynchronous parsing
   - Decouple upload from parsing

2. **Advanced AI Features**
   - Skill matching against job descriptions
   - Resume quality scoring
   - Suggested improvements

3. **Multi-language Support**
   - Parse resumes in different languages
   - Translate content to English

4. **Resume Comparison**
   - Compare multiple versions
   - Highlight changes

5. **Export Functionality**
   - Export parsed content to JSON/CSV
   - Generate formatted resume from structured data

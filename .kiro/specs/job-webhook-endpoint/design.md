# Design Document: Job Webhook Endpoint

## Overview

The job webhook endpoint will be implemented as a new REST API endpoint that accepts HTTP POST requests containing job opportunity data. The system will validate, sanitize, and store job opportunities in the PostgreSQL database using Entity Framework Core, following the existing application architecture patterns.

## Architecture

The solution follows the existing MVC pattern with the following components:

- **JobWebhookController**: Handles HTTP requests and responses
- **JobOpportunity Model**: Entity representing job opportunity data
- **ApplicationDbContext**: Database context extended with JobOpportunity DbSet
- **JobWebhookService**: Business logic for validation and processing
- **ApiResponse**: Standardized response format (existing)

## Components and Interfaces

### 1. JobOpportunity Model

```csharp
public class JobOpportunity
{
    public int Id { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Emails { get; set; } = string.Empty;
    public string EmailType { get; set; } = "summary";
    public bool IsRemote { get; set; } = false;
    public string Salary { get; set; } = string.Empty;
    public string Link { get; set; } = string.Empty;
    public string Snippet { get; set; } = string.Empty;
    public DateTime ScrapedDate { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

### 2. JobWebhookController

```csharp
[ApiController]
[Route("api/[controller]")]
public class JobWebhookController : ControllerBase
{
    private readonly IJobWebhookService _jobWebhookService;
    
    [HttpPost]
    public async Task<ActionResult<ApiResponse<JobOpportunity>>> CreateJobOpportunity(
        [FromBody] JobOpportunityDto jobDto)
}
```

### 3. JobWebhookService Interface

```csharp
public interface IJobWebhookService
{
    Task<JobOpportunity> CreateJobOpportunityAsync(JobOpportunityDto jobDto);
    JobOpportunityDto ValidateAndSanitize(JobOpportunityDto jobDto);
}
```

### 4. Data Transfer Objects

```csharp
public class JobOpportunityDto
{
    public string JobTitle { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Emails { get; set; } = string.Empty;
    public string EmailType { get; set; } = "summary";
    public bool IsRemote { get; set; } = false;
    public string Salary { get; set; } = string.Empty;
    public string Link { get; set; } = string.Empty;
    public string Snippet { get; set; } = string.Empty;
    public DateTime? ScrapedDate { get; set; }
}
```

## Data Models

### Database Schema

The JobOpportunity table will be added to the existing PostgreSQL database:

```sql
CREATE TABLE JobOpportunities (
    Id SERIAL PRIMARY KEY,
    JobTitle VARCHAR(500) NOT NULL,
    Company VARCHAR(200) NOT NULL,
    Location VARCHAR(200),
    Emails TEXT,
    EmailType VARCHAR(50) DEFAULT 'summary',
    IsRemote BOOLEAN DEFAULT FALSE,
    Salary VARCHAR(100),
    Link TEXT,
    Snippet TEXT,
    ScrapedDate TIMESTAMP,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Entity Framework Configuration

```csharp
modelBuilder.Entity<JobOpportunity>(entity =>
{
    entity.HasKey(e => e.Id);
    entity.Property(e => e.JobTitle).IsRequired().HasMaxLength(500);
    entity.Property(e => e.Company).IsRequired().HasMaxLength(200);
    entity.Property(e => e.Location).HasMaxLength(200);
    entity.Property(e => e.EmailType).HasMaxLength(50).HasDefaultValue("summary");
    entity.Property(e => e.IsRemote).HasDefaultValue(false);
    entity.Property(e => e.Salary).HasMaxLength(100);
    entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
    entity.HasIndex(e => e.Company);
    entity.HasIndex(e => e.CreatedAt);
});
```

## Error Handling

### Validation Rules

1. **Required Fields**: JobTitle and Company must be non-empty strings
2. **String Length**: JobTitle max 500 chars, Company max 200 chars
3. **Boolean Validation**: IsRemote must be valid boolean
4. **Date Validation**: ScrapedDate must be valid DateTime if provided
5. **Input Sanitization**: HTML encoding for string fields to prevent XSS

### Error Response Format

Using existing ApiResponse pattern:

```csharp
// Success Response
{
    "success": true,
    "data": { /* JobOpportunity object */ },
    "message": "Job opportunity created successfully"
}

// Error Response
{
    "success": false,
    "data": null,
    "message": "Validation failed: JobTitle is required"
}
```

### HTTP Status Codes

- **200 OK**: Job opportunity created successfully
- **400 Bad Request**: Validation errors or malformed JSON
- **500 Internal Server Error**: Database or server errors

## Testing Strategy

### Unit Tests

1. **JobWebhookService Tests**:
   - Validation logic for required fields
   - Sanitization of input data
   - Default value assignment

2. **Controller Tests**:
   - HTTP request/response handling
   - Error response formatting
   - Status code validation

### Integration Tests

1. **Database Integration**:
   - Entity Framework operations
   - Database constraint validation
   - Transaction handling

2. **API Integration**:
   - End-to-end webhook request processing
   - JSON serialization/deserialization
   - CORS handling

### Test Data

```json
{
    "jobTitle": "Senior Software Engineer",
    "company": "Tech Corp",
    "location": "San Francisco, CA",
    "emails": "hr@techcorp.com",
    "emailType": "summary",
    "isRemote": true,
    "salary": "$120,000 - $150,000",
    "link": "https://techcorp.com/jobs/123",
    "snippet": "Join our team as a Senior Software Engineer...",
    "scrapedDate": "2025-10-17T09:06:40.457Z"
}
```

## Security Considerations

1. **Input Validation**: Strict validation of all input fields
2. **SQL Injection Prevention**: Using Entity Framework parameterized queries
3. **XSS Prevention**: HTML encoding of string inputs
4. **Rate Limiting**: Consider implementing rate limiting for webhook endpoint
5. **Authentication**: Currently no authentication required (as per requirements)

## Performance Considerations

1. **Database Indexing**: Indexes on Company and CreatedAt for efficient queries
2. **Async Operations**: All database operations are asynchronous
3. **Connection Pooling**: Leveraging existing EF Core connection pooling
4. **Logging**: Structured logging for monitoring and debugging

## Integration Points

### Existing Services

- **ApplicationDbContext**: Extended with JobOpportunity DbSet
- **Program.cs**: Service registration for IJobWebhookService
- **CORS Configuration**: Existing CORS policy will handle cross-origin requests

### Database Migration

A new Entity Framework migration will be created to add the JobOpportunities table:

```bash
dotnet ef migrations add AddJobOpportunityTable
dotnet ef database update
```

## API Documentation

### Endpoint

```
POST /api/jobwebhook
Content-Type: application/json
```

### Request Body

All fields except JobTitle and Company are optional:

```json
{
    "jobTitle": "string (required, max 500 chars)",
    "company": "string (required, max 200 chars)", 
    "location": "string (optional, max 200 chars)",
    "emails": "string (optional)",
    "emailType": "string (optional, default: 'summary', allowed: summary|detailed|instant|none|company|hr|recruiter|personal)",
    "isRemote": "boolean (optional, default: false)",
    "salary": "string (optional, max 100 chars)",
    "link": "string (optional)",
    "snippet": "string (optional)",
    "scrapedDate": "datetime (optional, ISO 8601 format)"
}
```

### Response Examples

**Success (200 OK)**:
```json
{
    "success": true,
    "data": {
        "id": 123,
        "jobTitle": "Senior Software Engineer",
        "company": "Tech Corp",
        "location": "San Francisco, CA",
        "emails": "hr@techcorp.com",
        "emailType": "summary",
        "isRemote": true,
        "salary": "$120,000 - $150,000",
        "link": "https://techcorp.com/jobs/123",
        "snippet": "Join our team...",
        "scrapedDate": "2025-10-17T09:06:40.457Z",
        "createdAt": "2025-10-17T10:15:30.123Z"
    },
    "message": "Job opportunity created successfully"
}
```

**Validation Error (400 Bad Request)**:
```json
{
    "success": false,
    "data": null,
    "message": "Validation failed: JobTitle is required"
}
```
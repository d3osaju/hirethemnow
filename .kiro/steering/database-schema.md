# Database Schema Documentation

## Overview

HireThemNow uses PostgreSQL 17.4 as its database, managed through Entity Framework Core with Npgsql provider. The database stores user information, resume content, analysis results, and application settings.

## Database Connection

- **Provider**: Npgsql (PostgreSQL for .NET)
- **Version**: PostgreSQL 17.4
- **ORM**: Entity Framework Core
- **Migrations**: Automatic on application startup

## Tables

### Users

Stores user account information and profile data.

**Table Name**: `Users`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| Id | string | No | - | Primary key (Google ID or generated GUID) |
| Name | string | No | "" | User's full name |
| Email | string | No | - | User's email (unique) |
| Role | string | No | "candidate" | User role: "candidate" or "employer" |
| Picture | string | Yes | null | Profile picture URL or S3 key |
| Phone | string | Yes | null | Phone number |
| Location | string | Yes | null | User's location |
| Bio | string | Yes | null | User biography |
| Skills | List<string> | No | [] | JSON array of skills |
| Title | string | Yes | null | Job title |
| Industry | string | Yes | null | Industry name |
| Experience | string | Yes | null | Years of experience |
| ResumeUrl | string | Yes | null | S3 key for resume file |
| CreatedAt | DateTime | No | UtcNow | Account creation timestamp |
| UpdatedAt | DateTime | No | UtcNow | Last update timestamp |
| IsCompleted | bool | No | false | Onboarding completion status |
| TrialStartDate | DateTime | No | UtcNow | Trial start date |
| TrialEndDate | DateTime | No | UtcNow+7days | Trial end date |
| IsTrialActive | bool | No | true | Trial active status |
| HasSeenTrialEndMessage | bool | No | false | Trial end message acknowledgment |
| HasActiveSubscription | bool | No | false | Subscription status |
| ProfileVisibility | string | No | "public" | "public", "private", or "connections" |
| AllowAnalyticsDataSharing | bool | No | true | Analytics consent |

**Indexes**:
- Unique index on `Email`

**Methods**:
- `HasAccess()`: Returns true if user has active trial or subscription

---

### EmailPreferences

Stores user email notification preferences.

**Table Name**: `EmailPreferences`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| Id | string | No | GUID | Primary key |
| UserId | string | No | - | Foreign key to Users |
| WeeklyPerformanceReport | bool | No | false | Weekly report opt-in |
| MarketingEmails | bool | No | false | Marketing emails opt-in |
| CreatedAt | DateTime | No | UtcNow | Creation timestamp |
| UpdatedAt | DateTime | No | UtcNow | Last update timestamp |

**Indexes**:
- Unique index on `UserId`

**Relationships**:
- One-to-one with `Users` (CASCADE delete)

---

### ResumeContents

Stores uploaded resume files and parsing status.

**Table Name**: `resume_contents`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | int | No | Auto | Primary key |
| user_id | string | No | - | Foreign key to Users |
| s3_key | string | No | - | S3 object key |
| file_name | string | No | - | Original filename |
| content_type | string | No | - | File type: "pdf", "doc", "docx" |
| parsed_content | string | No | "" | JSON structured content |
| text_content | string | Yes | null | Plain text extraction |
| parsing_status | string | No | "pending" | "pending", "processing", "completed", "failed" |
| parsing_error | string | Yes | null | Error message if failed |
| file_size_bytes | long | No | - | File size in bytes |
| uploaded_at | DateTime | No | UtcNow | Upload timestamp |
| parsed_at | DateTime | Yes | null | Parsing completion timestamp |
| created_at | DateTime | No | UtcNow | Creation timestamp |
| updated_at | DateTime | No | UtcNow | Last update timestamp |

**Indexes**:
- Index on `user_id`
- Composite index on `(user_id, uploaded_at)`

**Relationships**:
- Many-to-one with `Users` (CASCADE delete)

---

### ResumeAnalyses

Stores AI-powered resume analysis results and ATS scores. Each analysis is linked to a specific ResumeContent record through a foreign key relationship, enabling the two-phase processing architecture where parsing must complete before analysis begins.

**Table Name**: `resume_analyses`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | int | No | Auto | Primary key |
| user_id | string | No | - | Foreign key to Users |
| resume_content_id | int | Yes | null | Foreign key to ResumeContents (links analysis to specific resume) |
| resume_url | string | Yes | null | S3 URL (legacy field) |
| personal_info | string | Yes | null | JSON: name, email, phone, location |
| technical_skills | string | Yes | null | JSON array of technical skills |
| soft_skills | string | Yes | null | JSON array of soft skills |
| programming_languages | string | Yes | null | JSON array of programming languages |
| tools | string | Yes | null | JSON array of tools and technologies |
| experience_summary | string | Yes | null | Text summary of work experience |
| education | string | Yes | null | JSON array of education records |
| certifications | string | Yes | null | JSON array of certifications |
| summary | string | Yes | null | Resume summary/objective |
| years_of_experience | int | Yes | null | Total years of experience |
| s3_url | string | Yes | null | S3 file URL (legacy field) |
| ats_overall_score | int | Yes | null | Overall ATS score (0-100) |
| ats_formatting_score | int | Yes | null | Formatting score (0-100) |
| ats_keywords_score | int | Yes | null | Keywords score (0-100) |
| ats_experience_score | int | Yes | null | Experience score (0-100) |
| ats_education_score | int | Yes | null | Education score (0-100) |
| ats_skills_score | int | Yes | null | Skills score (0-100) |
| ats_achievements_score | int | Yes | null | Achievements score (0-100) |
| strengths | string | Yes | null | JSON array of resume strengths |
| weaknesses | string | Yes | null | JSON array of resume weaknesses |
| improvements | string | Yes | null | JSON array of improvement suggestions (legacy) |
| recommendations | string | Yes | null | JSON array of actionable recommendations |
| keywords_found | string | Yes | null | JSON array of keywords found in resume |
| keywords_missing | string | Yes | null | JSON array of missing industry keywords |
| keyword_density | int | Yes | null | Keyword density percentage (0-100) |
| readability_score | int | Yes | null | Readability score (0-100) |
| readability_issues | string | Yes | null | JSON array of readability issues |
| section_feedback | string | Yes | null | JSON object with per-section analysis feedback |
| analysis_error | string | Yes | null | Error message if analysis failed |
| status | string | No | "waiting_for_parsing" | Analysis status: "waiting_for_parsing", "processing", "completed", "failed" |
| processed_at | DateTime | Yes | null | Analysis completion timestamp |
| created_at | DateTime | No | UtcNow | Creation timestamp |
| updated_at | DateTime | No | UtcNow | Last update timestamp |

**Indexes**:
- Index on `user_id`
- Index on `status` (for background service polling)
- Index on `resume_content_id` (foreign key)

**Relationships**:
- Many-to-one with `Users` (CASCADE delete)
- Many-to-one with `ResumeContents` via `resume_content_id` (SET NULL on delete)

**Status Values**:
- `waiting_for_parsing`: Analysis created but waiting for corresponding resume parsing to complete
- `processing`: Analysis is currently being performed by background service
- `completed`: Analysis finished successfully with results stored
- `failed`: Analysis failed due to error (see analysis_error column)

---

### Industries

Stores industry categories for user profiles.

**Table Name**: `Industries`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| Id | int | No | Auto | Primary key |
| Name | string | No | - | Industry name (max 100 chars) |

**Indexes**:
- Unique index on `Name`

**Seed Data**: 10 industries (Technology, Finance, Healthcare, Education, Marketing, Sales, Manufacturing, Retail, Hospitality, Construction)

---

### SkillExpertises

Stores skills associated with industries.

**Table Name**: `SkillExpertises`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| Id | int | No | Auto | Primary key |
| Name | string | No | - | Skill name (max 100 chars) |
| IndustryId | int | No | - | Foreign key to Industries |

**Relationships**:
- Many-to-one with `Industries` (CASCADE delete)

**Seed Data**: 105 skills across 10 industries (e.g., JavaScript, Python, React for Technology)

---

### ReleaseNotes

Stores application release notes and version history.

**Table Name**: `ReleaseNotes`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| Id | int | No | Auto | Primary key |
| Version | string | No | - | Version number (max 20 chars) |
| ReleaseDate | DateTime | No | - | Release date |
| Features | List<string> | No | [] | JSON array of features |
| CreatedAt | DateTime | No | UtcNow | Creation timestamp |
| IsPublished | bool | No | true | Publication status |

**Seed Data**: 2 release notes (v1.2.0, v1.1.0)

---

## Relationships Diagram

```
Users (1) ----< (Many) ResumeContents
Users (1) ----< (Many) ResumeAnalyses
Users (1) ---- (1) EmailPreferences

ResumeContents (1) ----< (Many) ResumeAnalyses

Industries (1) ----< (Many) SkillExpertises
```

## Detailed Relationships

### Users ↔ ResumeContents
- **Type**: One-to-Many
- **Foreign Key**: `ResumeContents.user_id` → `Users.Id`
- **Cascade Behavior**: CASCADE DELETE (when user is deleted, all their resume content is deleted)
- **Purpose**: Links resume uploads to user accounts

### Users ↔ ResumeAnalyses  
- **Type**: One-to-Many
- **Foreign Key**: `ResumeAnalyses.user_id` → `Users.Id`
- **Cascade Behavior**: CASCADE DELETE (when user is deleted, all their analyses are deleted)
- **Purpose**: Links analysis results to user accounts

### Users ↔ EmailPreferences
- **Type**: One-to-One
- **Foreign Key**: `EmailPreferences.UserId` → `Users.Id`
- **Cascade Behavior**: CASCADE DELETE (when user is deleted, their email preferences are deleted)
- **Constraint**: Unique constraint on `EmailPreferences.UserId`
- **Purpose**: Stores user-specific email notification settings

### ResumeContents ↔ ResumeAnalyses
- **Type**: One-to-Many
- **Foreign Key**: `ResumeAnalyses.resume_content_id` → `ResumeContents.id`
- **Cascade Behavior**: SET NULL (when resume content is deleted, analysis records remain but foreign key is set to null)
- **Purpose**: Links analysis results to specific resume versions, enabling two-phase processing architecture
- **Dependency**: Analysis cannot proceed until corresponding ResumeContent has status "completed"
- **Index**: `IX_resume_analyses_resume_content_id` for efficient lookups

### Industries ↔ SkillExpertises
- **Type**: One-to-Many  
- **Foreign Key**: `SkillExpertises.IndustryId` → `Industries.Id`
- **Cascade Behavior**: CASCADE DELETE (when industry is deleted, all associated skills are deleted)
- **Purpose**: Categorizes skills by industry for user profile suggestions

## Indexes and Performance

### Primary Indexes

All tables have primary key indexes automatically created:
- `Users.Id` (Primary Key)
- `ResumeContents.id` (Primary Key, Auto-increment)
- `ResumeAnalyses.id` (Primary Key, Auto-increment)
- `EmailPreferences.Id` (Primary Key)
- `Industries.Id` (Primary Key, Auto-increment)
- `SkillExpertises.Id` (Primary Key, Auto-increment)
- `ReleaseNotes.Id` (Primary Key, Auto-increment)

### Foreign Key Indexes

Foreign key relationships have indexes for efficient joins:
- `IX_EmailPreferences_UserId` on `EmailPreferences.UserId`
- `IX_resume_contents_user_id` on `ResumeContents.user_id`
- `IX_resume_analyses_user_id` on `ResumeAnalyses.user_id`
- `IX_resume_analyses_resume_content_id` on `ResumeAnalyses.resume_content_id`
- `IX_SkillExpertises_IndustryId` on `SkillExpertises.IndustryId`

### Unique Indexes

Enforce data integrity constraints:
- `IX_Users_Email` (Unique) on `Users.Email`
- `IX_EmailPreferences_UserId` (Unique) on `EmailPreferences.UserId`
- `IX_Industries_Name` (Unique) on `Industries.Name`

### Performance Indexes

Optimized for common query patterns:

#### ResumeContents Performance Indexes
- `IX_resume_contents_user_uploaded` on `(user_id, uploaded_at)` - For user resume history queries
- `IX_resume_contents_parsing_status` on `parsing_status` - For background service polling

#### ResumeAnalyses Performance Indexes
- `IX_resume_analyses_status` on `status` - **Critical for background service polling**
- `IX_resume_analyses_user_status` on `(user_id, status)` - For user-specific status queries
- `IX_resume_analyses_processed_at` on `processed_at` - For chronological analysis queries

### Analysis Query Performance Considerations

The ResumeAnalyses table requires special attention for performance due to background processing requirements:

#### Background Service Polling Queries
```sql
-- Phase 2 polling query (most frequent)
SELECT * FROM resume_analyses 
WHERE status = 'waiting_for_parsing' 
  AND resume_content_id IN (
    SELECT id FROM resume_contents 
    WHERE parsing_status = 'completed'
  ) 
ORDER BY created_at ASC;
```

**Optimization Strategy**:
- `IX_resume_analyses_status` index enables fast filtering by status
- `IX_resume_contents_parsing_status` index optimizes the subquery
- Consider composite index `IX_resume_analyses_status_created` on `(status, created_at)` for high-volume scenarios

#### User Status Queries
```sql
-- User checking their analysis status
SELECT * FROM resume_analyses 
WHERE user_id = ? 
ORDER BY created_at DESC 
LIMIT 1;
```

**Optimization Strategy**:
- `IX_resume_analyses_user_id` index handles user filtering
- Consider composite index `IX_resume_analyses_user_created` on `(user_id, created_at DESC)` for frequent status checks

#### Analysis Results Queries
```sql
-- Retrieving completed analysis results
SELECT * FROM resume_analyses 
WHERE user_id = ? 
  AND status = 'completed' 
ORDER BY processed_at DESC;
```

**Optimization Strategy**:
- Composite index `IX_resume_analyses_user_status` on `(user_id, status)` optimizes this common pattern
- `processed_at` index helps with chronological ordering

### Index Strategy Recommendations

1. **Monitor Query Performance**: Use PostgreSQL's `pg_stat_statements` to identify slow queries
2. **Background Service Optimization**: The `status` index on ResumeAnalyses is critical for background service performance
3. **Composite Index Consideration**: For high-volume scenarios, consider composite indexes:
   - `(user_id, status, created_at)` for user-specific status queries
   - `(status, created_at)` for background service polling
4. **Partial Indexes**: Consider partial indexes for active records:
   - `WHERE status IN ('waiting_for_parsing', 'processing')` for active analyses
5. **Index Maintenance**: Regular `VACUUM` and `ANALYZE` operations to maintain index performance

### Performance Monitoring

Key metrics to monitor:
- Background service polling query execution time (should be <100ms)
- User status check query execution time (should be <50ms)
- Analysis results retrieval time (should be <200ms)
- Index usage statistics via `pg_stat_user_indexes`

## JSON Column Formats

### Users.Skills
```json
["JavaScript", "React", "Node.js"]
```

### ResumeAnalyses.personal_info
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "location": "New York, NY"
}
```

### ResumeContents.parsed_content
```json
{
  "personalInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "location": "New York, NY",
    "linkedin": "linkedin.com/in/johndoe",
    "github": "github.com/johndoe"
  },
  "experience": [
    {
      "company": "Tech Corp",
      "title": "Software Engineer",
      "startDate": "2020-01",
      "endDate": "2023-12",
      "isCurrent": false,
      "location": "San Francisco, CA",
      "description": "Developed web applications",
      "achievements": ["Increased performance by 50%"],
      "technologies": ["React", "Node.js"]
    }
  ],
  "education": [
    {
      "institution": "University",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "startDate": "2016",
      "endDate": "2020",
      "gpa": "3.8",
      "honors": ["Dean's List"]
    }
  ],
  "skills": {
    "technical": ["JavaScript", "Python"],
    "soft": ["Communication", "Leadership"],
    "languages": ["English", "Spanish"],
    "tools": ["Git", "Docker"]
  },
  "certifications": [
    {
      "name": "AWS Certified",
      "issuer": "Amazon",
      "date": "2023-01",
      "credentialId": "ABC123"
    }
  ],
  "summary": "Experienced software engineer...",
  "projects": [
    {
      "name": "Project Name",
      "description": "Description",
      "technologies": ["React"],
      "link": "https://example.com",
      "github": "github.com/user/repo"
    }
  ]
}
```

### ResumeAnalyses JSON Column Formats

#### strengths, weaknesses, recommendations
```json
[
  "Strong technical skills clearly presented",
  "Quantifiable achievements in work experience",
  "Professional formatting and structure"
]
```

#### keywords_found, keywords_missing
```json
[
  "JavaScript",
  "React", 
  "Node.js",
  "MongoDB",
  "Git"
]
```

#### readability_issues
```json
[
  "Some sentences are too long (>25 words)",
  "Consider using more bullet points for better readability"
]
```

#### technical_skills, soft_skills, programming_languages, tools
```json
[
  "JavaScript",
  "Python",
  "React",
  "Docker"
]
```

#### education
```json
[
  {
    "institution": "University of Technology",
    "degree": "Bachelor of Science",
    "field": "Computer Science",
    "startDate": "2016",
    "endDate": "2020",
    "gpa": "3.8",
    "honors": ["Dean's List", "Magna Cum Laude"]
  }
]
```

#### certifications
```json
[
  {
    "name": "AWS Certified Solutions Architect",
    "issuer": "Amazon Web Services",
    "date": "2023-01",
    "expirationDate": "2026-01",
    "credentialId": "AWS-CSA-123456"
  }
]
```

#### section_feedback
```json
{
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
}
```

## Migration Commands

```bash
# Create new migration
dotnet ef migrations add MigrationName --project HireThemNoW.Server

# Apply migrations
dotnet ef database update --project HireThemNoW.Server

# Revert migration
dotnet ef database update PreviousMigrationName --project HireThemNoW.Server

# Remove last migration
dotnet ef migrations remove --project HireThemNoW.Server
```

## Database Access

The application uses `ApplicationDbContext` for database access:

```csharp
public class ApplicationDbContext : DbContext
{
    public DbSet<User> Users { get; set; }
    public DbSet<EmailPreference> EmailPreferences { get; set; }
    public DbSet<Industry> Industries { get; set; }
    public DbSet<SkillExpertise> SkillExpertises { get; set; }
    public DbSet<ReleaseNote> ReleaseNotes { get; set; }
    public DbSet<ResumeAnalysis> ResumeAnalyses { get; set; }
    public DbSet<ResumeContent> ResumeContents { get; set; }
}
```

## Connection String Format

```
Host={DATABASE_HOST};Database={DATABASE_NAME};Username={DATABASE_USER};Password={DATABASE_PASSWORD};
```

Example:
```
Host=hirethemnow-db.abc123.us-east-1.rds.amazonaws.com;Database=postgres;Username=postgres;Password=SecurePassword123;
```

## Best Practices

1. **Always use migrations** for schema changes
2. **Never commit connection strings** with real credentials
3. **Use environment variables** for sensitive data
4. **Test migrations locally** before deploying
5. **Backup database** before major migrations
6. **Use transactions** for complex operations
7. **Index frequently queried columns**
8. **Avoid N+1 queries** with `.Include()`
9. **Use async methods** for database operations
10. **Validate data** before saving to database

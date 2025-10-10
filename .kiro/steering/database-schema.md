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

Stores AI-powered resume analysis results and ATS scores.

**Table Name**: `resume_analyses`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | int | No | Auto | Primary key |
| user_id | string | No | - | Foreign key to Users |
| resume_url | string | Yes | null | S3 URL |
| personal_info | string | Yes | null | JSON: name, email, phone, location |
| technical_skills | string | Yes | null | JSON array |
| soft_skills | string | Yes | null | JSON array |
| programming_languages | string | Yes | null | JSON array |
| tools | string | Yes | null | JSON array |
| experience_summary | string | Yes | null | Text summary |
| education | string | Yes | null | JSON array |
| certifications | string | Yes | null | JSON array |
| summary | string | Yes | null | Resume summary |
| years_of_experience | int | Yes | null | Total years |
| s3_url | string | Yes | null | S3 file URL |
| ats_overall_score | int | Yes | null | Overall ATS score (0-100) |
| ats_formatting_score | int | Yes | null | Formatting score |
| ats_keywords_score | int | Yes | null | Keywords score |
| ats_experience_score | int | Yes | null | Experience score |
| ats_education_score | int | Yes | null | Education score |
| ats_skills_score | int | Yes | null | Skills score |
| ats_achievements_score | int | Yes | null | Achievements score |
| strengths | string | Yes | null | JSON array |
| weaknesses | string | Yes | null | JSON array |
| improvements | string | Yes | null | JSON array |
| keywords_found | string | Yes | null | JSON array |
| keywords_missing | string | Yes | null | JSON array |
| keyword_density | int | Yes | null | Percentage |
| readability_score | int | Yes | null | Score (0-100) |
| readability_issues | string | Yes | null | JSON array |
| recommendations | string | Yes | null | JSON array |
| status | string | No | "pending" | "pending", "processing", "completed", "failed" |
| processed_at | DateTime | No | UtcNow | Processing timestamp |
| created_at | DateTime | No | UtcNow | Creation timestamp |
| updated_at | DateTime | No | UtcNow | Last update timestamp |

**Relationships**:
- Many-to-one with `Users` (CASCADE delete)

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

Industries (1) ----< (Many) SkillExpertises
```

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

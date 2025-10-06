# Requirements Document

## Introduction

This feature adds automatic resume parsing functionality to extract and store structured content from uploaded resumes in a usable JSON format. When a user uploads or updates their resume, the system will automatically parse the document, extract key information (contact details, work experience, education, skills, etc.), and store it in the database for later use in job matching, profile completion, and analytics.

## Requirements

### Requirement 1: Automatic Resume Parsing on Upload

**User Story:** As a recruiter or job seeker, I want my resume to be automatically parsed when I upload it, so that the system can extract and store my information in a structured format without manual data entry.

#### Acceptance Criteria

1. WHEN a user uploads a resume THEN the system SHALL automatically trigger a parsing process
2. WHEN the parsing process starts THEN the system SHALL update the parsing status to "processing"
3. WHEN the resume is successfully parsed THEN the system SHALL store the extracted content as JSON in the database
4. WHEN the resume is successfully parsed THEN the system SHALL update the parsing status to "completed"
5. IF the parsing fails THEN the system SHALL update the parsing status to "failed" AND store the error message
6. WHEN parsing completes THEN the system SHALL store both structured JSON content AND plain text content

### Requirement 2: Automatic Re-parsing on Resume Update

**User Story:** As a user, I want my resume to be automatically re-parsed when I upload a new version, so that my profile information stays current without manual updates.

#### Acceptance Criteria

1. WHEN a user uploads a new resume THEN the system SHALL create a new parsing record
2. WHEN a new resume is uploaded THEN the system SHALL preserve the previous parsing record for history
3. WHEN re-parsing occurs THEN the system SHALL follow the same parsing process as initial upload
4. WHEN re-parsing completes THEN the system SHALL mark the new record as the latest version

### Requirement 3: Structured JSON Content Storage

**User Story:** As a developer, I want resume content stored in a well-defined JSON structure, so that I can easily query and use the data for job matching and analytics.

#### Acceptance Criteria

1. WHEN storing parsed content THEN the system SHALL include personal information (name, email, phone, location, LinkedIn, portfolio)
2. WHEN storing parsed content THEN the system SHALL include work experience with company, title, dates, description, and achievements
3. WHEN storing parsed content THEN the system SHALL include education with institution, degree, field, dates, and GPA
4. WHEN storing parsed content THEN the system SHALL include skills categorized as technical, soft, languages, and tools
5. WHEN storing parsed content THEN the system SHALL include certifications with name, issuer, and date
6. WHEN storing parsed content THEN the system SHALL include a professional summary
7. WHEN storing parsed content THEN the system SHALL include projects with name, description, technologies, and links
8. WHEN storing parsed content THEN the system SHALL store the complete JSON in the `parsed_content` column

### Requirement 4: Resume Content Retrieval API

**User Story:** As a frontend developer, I want an API endpoint to retrieve parsed resume content, so that I can display structured information to users and use it for profile auto-fill.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/resume/content` THEN the system SHALL return the latest parsed content for the authenticated user
2. WHEN parsed content exists THEN the system SHALL return status 200 with the JSON content
3. WHEN no parsed content exists THEN the system SHALL return status 404 with an appropriate message
4. WHEN the parsing is still in progress THEN the system SHALL return status 202 with parsing status
5. WHEN parsing failed THEN the system SHALL return status 200 with status "failed" and error details

### Requirement 5: Resume Parsing Service Integration

**User Story:** As a system administrator, I want the resume parsing to use a reliable document parsing service, so that we can accurately extract text and structure from PDF, DOC, and DOCX files.

#### Acceptance Criteria

1. WHEN parsing a PDF file THEN the system SHALL extract text content accurately
2. WHEN parsing a DOC file THEN the system SHALL extract text content accurately
3. WHEN parsing a DOCX file THEN the system SHALL extract text content accurately
4. IF a file format is unsupported THEN the system SHALL return an error with status "failed"
5. WHEN text extraction completes THEN the system SHALL use AI/NLP to structure the content into JSON format

### Requirement 6: Plain Text Content Storage

**User Story:** As a developer, I want the raw text content stored separately from structured JSON, so that I can perform full-text search and fallback operations.

#### Acceptance Criteria

1. WHEN parsing completes THEN the system SHALL store the extracted plain text in the `text_content` column
2. WHEN storing plain text THEN the system SHALL preserve formatting where possible (line breaks, sections)
3. WHEN plain text extraction fails THEN the system SHALL still attempt to create structured JSON from available data

### Requirement 7: Parsing Status Tracking

**User Story:** As a user, I want to see the status of my resume parsing, so that I know when my information is ready to use.

#### Acceptance Criteria

1. WHEN a resume is uploaded THEN the initial status SHALL be "pending"
2. WHEN parsing begins THEN the status SHALL change to "processing"
3. WHEN parsing succeeds THEN the status SHALL change to "completed"
4. IF parsing fails THEN the status SHALL change to "failed"
5. WHEN checking status THEN the system SHALL return the current parsing status and timestamp

### Requirement 8: File Metadata Storage

**User Story:** As a system administrator, I want to track file metadata for uploaded resumes, so that I can monitor storage usage and troubleshoot issues.

#### Acceptance Criteria

1. WHEN a resume is uploaded THEN the system SHALL store the S3 key
2. WHEN a resume is uploaded THEN the system SHALL store the original filename
3. WHEN a resume is uploaded THEN the system SHALL store the content type (pdf, doc, docx)
4. WHEN a resume is uploaded THEN the system SHALL store the file size in bytes
5. WHEN a resume is uploaded THEN the system SHALL store the upload timestamp
6. WHEN parsing completes THEN the system SHALL store the parsed timestamp

### Requirement 9: Database Schema Integration

**User Story:** As a database administrator, I want the resume content table properly integrated with the existing schema, so that data integrity is maintained.

#### Acceptance Criteria

1. WHEN the feature is deployed THEN the `resume_contents` table SHALL be added to the database
2. WHEN a user is deleted THEN their resume content records SHALL be cascade deleted
3. WHEN querying resume content THEN the system SHALL support filtering by user_id
4. WHEN querying resume content THEN the system SHALL support ordering by upload date
5. WHEN multiple resume versions exist THEN the system SHALL be able to retrieve the latest version

### Requirement 10: Error Handling and Logging

**User Story:** As a system administrator, I want comprehensive error handling and logging for resume parsing, so that I can troubleshoot issues and monitor system health.

#### Acceptance Criteria

1. WHEN parsing fails THEN the system SHALL log the error with user context
2. WHEN parsing fails THEN the system SHALL store the error message in the database
3. WHEN an exception occurs THEN the system SHALL return a user-friendly error message
4. WHEN parsing takes longer than expected THEN the system SHALL log a warning
5. WHEN parsing completes THEN the system SHALL log success with processing time

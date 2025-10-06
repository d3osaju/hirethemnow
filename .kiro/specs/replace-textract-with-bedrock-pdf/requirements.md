# Requirements Document

## Introduction

This feature replaces AWS Textract with direct Bedrock PDF parsing to improve resume document processing. Currently, the system uses a two-step process (Textract for text extraction, then Bedrock for structuring), which has limitations with document format support and adds complexity. By using Bedrock's native document understanding capabilities (Claude 3 or Nova), we can parse PDFs, DOCs, and DOCX files directly in a single API call, eliminating Textract's format restrictions and improving reliability.

## Requirements

### Requirement 1: Direct PDF Parsing with Bedrock

**User Story:** As a recruiter, I want to upload PDF resumes and have them parsed successfully, so that I can analyze candidate information without format-related errors.

#### Acceptance Criteria

1. WHEN a user uploads a PDF resume THEN the system SHALL download the file from S3 and send it directly to Bedrock for parsing
2. WHEN Bedrock receives a PDF document THEN it SHALL extract text content and structure it into the required JSON format in a single operation
3. WHEN parsing completes successfully THEN the system SHALL store the structured content in the database with status "completed"
4. WHEN parsing fails THEN the system SHALL log the specific error and update the status to "failed" with a user-friendly message

### Requirement 2: Support Multiple Document Formats

**User Story:** As a recruiter, I want to upload resumes in various formats (PDF, DOC, DOCX), so that I can process documents regardless of how candidates submit them.

#### Acceptance Criteria

1. WHEN a user uploads a PDF file THEN the system SHALL parse it using Bedrock's document understanding
2. WHEN a user uploads a DOC or DOCX file THEN the system SHALL return a clear error message indicating only PDF is currently supported
3. WHEN the system validates file format THEN it SHALL check the actual file content type, not just the extension
4. WHEN an unsupported format is uploaded THEN the system SHALL reject it at upload time with a descriptive error message

### Requirement 3: Remove Textract Dependency

**User Story:** As a system administrator, I want to remove the Textract dependency, so that the system has fewer AWS service dependencies and lower operational complexity.

#### Acceptance Criteria

1. WHEN the system parses a resume THEN it SHALL NOT call AWS Textract services
2. WHEN the application starts THEN it SHALL NOT require Textract IAM permissions
3. WHEN reviewing the codebase THEN there SHALL be no references to Textract client or services except in removed/deprecated code
4. WHEN the deployment script runs THEN it SHALL NOT configure Textract permissions in IAM policies

### Requirement 4: Maintain Parsing Performance

**User Story:** As a recruiter, I want resume parsing to complete quickly, so that I can review candidate information without delays.

#### Acceptance Criteria

1. WHEN a resume is parsed using Bedrock directly THEN the total processing time SHALL be less than or equal to the previous two-step process
2. WHEN parsing completes THEN the system SHALL log the processing time for monitoring
3. WHEN multiple resumes are being processed THEN the system SHALL maintain the concurrent processing limit of 3 resumes
4. WHEN parsing takes longer than 30 seconds THEN the system SHALL log a warning and continue processing

### Requirement 5: Enhanced Error Handling

**User Story:** As a recruiter, I want clear error messages when resume parsing fails, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN Bedrock returns an error THEN the system SHALL log the detailed technical error for debugging
2. WHEN parsing fails THEN the user SHALL receive a specific, actionable error message (not generic)
3. WHEN a PDF is corrupted or encrypted THEN the error message SHALL indicate "The PDF file appears to be corrupted or password-protected"
4. WHEN Bedrock service is unavailable THEN the error message SHALL indicate "Resume parsing service is temporarily unavailable"
5. WHEN file size exceeds limits THEN the error message SHALL indicate the maximum allowed file size

### Requirement 6: Configuration Flexibility

**User Story:** As a system administrator, I want to configure which Bedrock model is used for parsing, so that I can optimize for cost and performance.

#### Acceptance Criteria

1. WHEN the application starts THEN it SHALL read the Bedrock model ID from configuration
2. WHEN the model ID is not configured THEN the system SHALL use a sensible default (Claude 3 Sonnet)
3. WHEN the configuration changes THEN the system SHALL use the new model without requiring code changes
4. WHEN using Claude 3 models THEN the system SHALL support document parsing with PDF input
5. WHEN the configured model doesn't support document parsing THEN the system SHALL log an error at startup

### Requirement 7: Backward Compatibility

**User Story:** As a system administrator, I want existing parsed resumes to remain accessible, so that historical data is not lost during the migration.

#### Acceptance Criteria

1. WHEN the new parsing method is deployed THEN existing resume records in the database SHALL remain unchanged
2. WHEN viewing previously parsed resumes THEN the system SHALL display them correctly
3. WHEN the database schema is updated THEN it SHALL not require data migration for existing records
4. WHEN new resumes are parsed THEN they SHALL use the same database schema as before

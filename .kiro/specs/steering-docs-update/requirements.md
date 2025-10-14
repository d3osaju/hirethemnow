# Requirements Document

## Introduction

The HireThemNow steering documentation needs to be updated to reflect recent changes and new features that have been implemented in the application. The current documentation is missing several new API endpoints, services, and architectural changes that have been added to the system, particularly around resume analysis functionality and enhanced background processing.

## Requirements

### Requirement 1

**User Story:** As a developer working with Kiro, I want the API endpoints documentation to include all current endpoints, so that I have accurate information about available functionality.

#### Acceptance Criteria

1. WHEN reviewing the API endpoints documentation THEN it SHALL include the new ResumeAnalysisController endpoints
2. WHEN checking the resume analysis endpoints THEN the documentation SHALL include GET /api/resume/analysis/status endpoint with all response formats
3. WHEN checking the resume analysis endpoints THEN the documentation SHALL include GET /api/resume/analysis/results endpoint with detailed response schemas
4. WHEN checking the resume analysis endpoints THEN the documentation SHALL include POST /api/resume/analysis/retry endpoint with proper request/response documentation
5. WHEN reviewing endpoint documentation THEN all status codes (200, 202, 404, 500) SHALL be properly documented with examples

### Requirement 2

**User Story:** As a developer working with the resume parsing system, I want the resume parsing documentation to reflect the current two-phase processing architecture, so that I understand how parsing and analysis work together.

#### Acceptance Criteria

1. WHEN reviewing the resume parsing documentation THEN it SHALL clearly describe the two-phase processing (parsing first, then analysis)
2. WHEN checking the processing flow THEN the documentation SHALL show that analysis waits for parsing completion automatically
3. WHEN reviewing background service documentation THEN it SHALL describe the dual-phase polling mechanism
4. WHEN checking configuration options THEN the documentation SHALL include all current appsettings.json parameters including AnalysisBedrockModelId, AnalysisMaxTokens, AnalysisTemperature, and AnalysisTopP
5. WHEN reviewing status values THEN the documentation SHALL include "waiting_for_parsing" status for ResumeAnalysis table

### Requirement 3

**User Story:** As a developer working with the database, I want the database schema documentation to include all current tables and relationships, so that I have accurate schema information.

#### Acceptance Criteria

1. WHEN reviewing the database schema THEN it SHALL include the ResumeAnalysis table with all current columns
2. WHEN checking the ResumeAnalysis table THEN the documentation SHALL include the resume_content_id foreign key relationship
3. WHEN reviewing table relationships THEN the documentation SHALL show the relationship between ResumeContent and ResumeAnalysis tables
4. WHEN checking status values THEN the documentation SHALL include "waiting_for_parsing" as a valid status for ResumeAnalysis
5. WHEN reviewing indexes THEN the documentation SHALL include the status index on ResumeAnalysis table

### Requirement 4

**User Story:** As a developer working with services, I want the application overview to reflect current service architecture, so that I understand the complete system design.

#### Acceptance Criteria

1. WHEN reviewing the application overview THEN it SHALL include ResumeAnalysisService in the service architecture
2. WHEN checking service dependencies THEN the documentation SHALL show the relationship between ResumeParsingService and ResumeAnalysisService
3. WHEN reviewing background processing THEN the documentation SHALL describe the ResumeParsingBackgroundService handling both parsing and analysis phases
4. WHEN checking service registration THEN the documentation SHALL include IResumeAnalysisService registration in Program.cs
5. WHEN reviewing the processing flow THEN it SHALL show the automatic transition from parsing to analysis

### Requirement 5

**User Story:** As a developer working with AWS services, I want the AWS services documentation to reflect current Bedrock usage for both parsing and analysis, so that I understand the complete AI integration.

#### Acceptance Criteria

1. WHEN reviewing Bedrock configuration THEN the documentation SHALL include separate model configurations for parsing and analysis
2. WHEN checking Bedrock usage THEN the documentation SHALL describe the two different prompts (parsing vs analysis)
3. WHEN reviewing configuration options THEN the documentation SHALL include AnalysisBedrockModelId, AnalysisMaxTokens, AnalysisTemperature, and AnalysisTopP parameters
4. WHEN checking permissions THEN the documentation SHALL reflect current IAM requirements for both parsing and analysis operations
5. WHEN reviewing cost optimization THEN the documentation SHALL include analysis-specific considerations

### Requirement 6

**User Story:** As a developer working with the codebase, I want the coding standards to reflect current patterns used in the ResumeAnalysisController and related services, so that I follow consistent practices.

#### Acceptance Criteria

1. WHEN reviewing controller patterns THEN the documentation SHALL include examples from ResumeAnalysisController
2. WHEN checking error handling THEN the documentation SHALL show the status-based response patterns used in analysis endpoints
3. WHEN reviewing service patterns THEN the documentation SHALL include examples from ResumeAnalysisService
4. WHEN checking async patterns THEN the documentation SHALL reflect current async/await usage in analysis services
5. WHEN reviewing logging patterns THEN the documentation SHALL include structured logging examples from analysis controllers

### Requirement 7

**User Story:** As a developer deploying the application, I want the deployment guide to include current environment variables and configuration requirements, so that I can deploy successfully.

#### Acceptance Criteria

1. WHEN reviewing environment variables THEN the documentation SHALL include all current ResumeParsing configuration options
2. WHEN checking configuration validation THEN the documentation SHALL describe the startup validation in Program.cs
3. WHEN reviewing service dependencies THEN the documentation SHALL include ResumeAnalysisService and ResumeParsingBackgroundService
4. WHEN checking monitoring THEN the documentation SHALL include analysis-specific CloudWatch log patterns
5. WHEN reviewing troubleshooting THEN the documentation SHALL include analysis-related error scenarios
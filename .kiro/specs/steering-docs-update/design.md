# Design Document

## Overview

This design outlines the comprehensive updates needed for the HireThemNow steering documentation to reflect the current state of the application. The updates will focus on documenting the new resume analysis functionality, enhanced background processing architecture, and updated API endpoints while maintaining consistency across all documentation files.

## Architecture

### Documentation Structure

The steering documentation follows a modular approach with each document serving a specific purpose:

```
.kiro/steering/
├── README.md                 # Overview and navigation
├── application-overview.md   # High-level system architecture
├── api-endpoints.md         # Complete API documentation
├── database-schema.md       # Database structure and relationships
├── resume-parsing.md        # Resume processing system details
├── aws-services.md          # AWS service configurations
├── coding-standards.md      # Development guidelines
└── deployment-guide.md      # Deployment procedures
```

### Update Strategy

The updates will be implemented in a coordinated manner to ensure consistency across all documents:

1. **Cross-Reference Updates**: Ensure all documents reference the same endpoints, services, and configurations
2. **Version Alignment**: Update all documents to reflect the current application state
3. **Example Consistency**: Use consistent examples and naming conventions across documents

## Components and Interfaces

### API Endpoints Documentation Updates

**New Endpoints to Document:**

1. **GET /api/resume/analysis/status**
   - Purpose: Get current analysis status for user's resume
   - Response variations based on status (waiting_for_parsing, processing, completed, failed)
   - HTTP status codes: 200, 202, 404, 500
   - Detailed error handling examples

2. **GET /api/resume/analysis/results**
   - Purpose: Get complete analysis results with ATS scores and recommendations
   - Comprehensive response schema with all analysis fields
   - Status-based responses (202 for processing, 200 for completed)
   - Section feedback structure documentation

3. **POST /api/resume/analysis/retry**
   - Purpose: Retry failed analysis or restart analysis process
   - Request/response patterns
   - Error scenarios and handling

**Enhanced Endpoint Documentation:**

- Updated resume upload flow to show automatic analysis creation
- Enhanced parsing status to include analysis relationship
- Updated error responses to reflect current patterns

### Resume Parsing System Updates

**Architecture Changes:**

1. **Two-Phase Processing Model**
   ```
   Phase 1: Resume Parsing (PdfPig + Bedrock for structuring)
   Phase 2: ATS Analysis (Bedrock for detailed analysis)
   ```

2. **Background Service Enhancement**
   - Dual-phase polling mechanism
   - Priority system (parsing before analysis)
   - Concurrent processing limits across both phases
   - Automatic transition from parsing to analysis

3. **Configuration Expansion**
   - Separate Bedrock model configurations for parsing vs analysis
   - Analysis-specific timeout and token limits
   - Temperature and TopP settings for analysis consistency

### Database Schema Updates

**New Relationships:**

1. **ResumeContent ↔ ResumeAnalysis**
   - Foreign key relationship via resume_content_id
   - Cascade behavior documentation
   - Index requirements

2. **Enhanced Status Management**
   - "waiting_for_parsing" status for ResumeAnalysis
   - Status transition flow documentation
   - Error state handling

**Table Updates:**

- ResumeAnalysis table with complete column documentation
- Index strategy for performance optimization
- JSON field formats for analysis results

### Service Architecture Updates

**New Services:**

1. **IResumeAnalysisService / ResumeAnalysisService**
   - Analysis orchestration and management
   - Integration with background processing
   - Error handling and retry logic

2. **Enhanced ResumeParsingBackgroundService**
   - Dual-phase processing logic
   - Concurrency management across parsing and analysis
   - Status transition handling

**Service Dependencies:**

```
ResumeController → ResumeParsingService → S3Service, BedrockAgentService
ResumeAnalysisController → ResumeAnalysisService → BedrockAgentService
ResumeParsingBackgroundService → ResumeParsingService, ResumeAnalysisService
```

## Data Models

### Enhanced Configuration Schema

**ResumeParsing Configuration:**

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

### API Response Models

**Analysis Status Response:**

```json
{
  "success": true,
  "message": "Analysis status retrieved successfully",
  "data": {
    "status": "completed",
    "message": "Analysis completed successfully! Your ATS score is 85/100.",
    "overallScore": 85,
    "completedAt": "2025-01-01T00:01:30Z",
    "errorMessage": null
  }
}
```

**Analysis Results Response:**

```json
{
  "success": true,
  "message": "Analysis results retrieved successfully",
  "data": {
    "id": 123,
    "userId": "user-id",
    "status": "completed",
    "atsOverallScore": 85,
    "atsFormattingScore": 90,
    "atsKeywordsScore": 80,
    "atsExperienceScore": 85,
    "atsEducationScore": 90,
    "atsSkillsScore": 85,
    "atsAchievementsScore": 80,
    "strengths": ["Strong technical skills clearly presented"],
    "weaknesses": ["Missing industry-specific keywords"],
    "recommendations": ["Add more industry-specific keywords"],
    "keywordsFound": ["JavaScript", "React"],
    "keywordsMissing": ["TypeScript", "AWS"],
    "keywordDensity": 75,
    "readabilityScore": 85,
    "readabilityIssues": ["Some sentences are too long"],
    "sectionFeedback": {
      "personalInfo": {
        "score": 95,
        "issues": [],
        "suggestions": ["Consider adding a LinkedIn profile URL"]
      }
    },
    "processedAt": "2025-01-01T00:01:30Z"
  }
}
```

## Error Handling

### Enhanced Error Documentation

**Analysis-Specific Errors:**

1. **Analysis Not Found (404)**
   - When user has no analysis record
   - Clear message directing to resume upload

2. **Analysis Still Processing (202)**
   - Different messages for waiting_for_parsing vs processing
   - Estimated completion times

3. **Analysis Failed (200 with error details)**
   - Detailed error messages
   - Retry instructions

**Background Processing Errors:**

1. **Parsing Failures**
   - PDF corruption or encryption
   - Bedrock service unavailability
   - Timeout scenarios

2. **Analysis Failures**
   - Bedrock model errors
   - Token limit exceeded
   - Service timeout

## Testing Strategy

### Documentation Validation

1. **Cross-Reference Validation**
   - Verify all endpoint references are consistent across documents
   - Ensure configuration examples match actual appsettings.json
   - Validate code examples against current implementation

2. **Example Testing**
   - Test all API examples against live endpoints
   - Verify configuration examples work in deployment
   - Validate code snippets compile and run

3. **Completeness Verification**
   - Ensure all new endpoints are documented
   - Verify all configuration options are covered
   - Check that all services are properly described

### Update Verification Process

1. **Technical Review**
   - Compare documentation against current codebase
   - Verify API endpoint accuracy
   - Validate configuration completeness

2. **Consistency Check**
   - Ensure naming conventions are consistent
   - Verify cross-references are accurate
   - Check that examples use same data formats

3. **Usability Testing**
   - Verify documentation helps developers understand the system
   - Ensure examples are clear and actionable
   - Check that troubleshooting guides are helpful

## Implementation Approach

### Phase 1: Core Documentation Updates

1. **API Endpoints Documentation**
   - Add ResumeAnalysisController endpoints
   - Update existing resume endpoints with analysis integration
   - Enhance error response documentation

2. **Resume Parsing System Documentation**
   - Update architecture description for two-phase processing
   - Document new configuration options
   - Enhance background service documentation

### Phase 2: Supporting Documentation Updates

1. **Database Schema Documentation**
   - Add ResumeAnalysis table documentation
   - Update relationship diagrams
   - Document new indexes and constraints

2. **Application Overview Updates**
   - Update service architecture diagrams
   - Document new processing flows
   - Update feature list with analysis capabilities

### Phase 3: Infrastructure and Standards Updates

1. **AWS Services Documentation**
   - Update Bedrock usage for dual-purpose (parsing + analysis)
   - Document new configuration parameters
   - Update cost estimates and optimization tips

2. **Coding Standards and Deployment Guide**
   - Add examples from ResumeAnalysisController
   - Update service registration patterns
   - Document new environment variables and validation

## Quality Assurance

### Documentation Standards

1. **Accuracy Requirements**
   - All code examples must be syntactically correct
   - All API examples must match actual endpoint behavior
   - All configuration examples must be valid

2. **Consistency Requirements**
   - Use consistent terminology across all documents
   - Maintain consistent formatting and structure
   - Use consistent example data and naming

3. **Completeness Requirements**
   - Cover all new functionality comprehensively
   - Include error scenarios and troubleshooting
   - Provide practical examples for all concepts

### Maintenance Strategy

1. **Version Tracking**
   - Document when each section was last updated
   - Track which application version the documentation reflects
   - Maintain change log for major updates

2. **Regular Review Process**
   - Schedule quarterly documentation reviews
   - Validate documentation against current codebase
   - Update examples and configurations as needed
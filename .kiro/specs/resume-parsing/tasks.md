# Implementation Plan

- [x] 1. Database schema and configuration setup



  - Add `ResumeContents` DbSet to ApplicationDbContext
  - Configure entity relationships and indexes
  - Create and apply database migration
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_


- [x] 2. Create data models for structured resume content

  - Create `StructuredResumeContent` class with all nested models (PersonalInformation, WorkExperience, Education, SkillsSection, Certification, Project)
  - Create `ParsedResumeResult` class for Bedrock response
  - Add JSON serialization attributes
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 3. Extend IDataService interface with resume content methods


  - Add `SaveResumeContentAsync` method
  - Add `GetLatestResumeContentAsync` method
  - Add `GetResumeContentHistoryAsync` method
  - Add `UpdateResumeContentStatusAsync` method
  - _Requirements: 9.1, 9.3, 9.4_


- [x] 4. Implement resume content data access in DatabaseDataService

  - Implement `SaveResumeContentAsync` with error handling
  - Implement `GetLatestResumeContentAsync` with ordering by upload date
  - Implement `GetResumeContentHistoryAsync` with user filtering
  - Implement `UpdateResumeContentStatusAsync` for status updates
  - _Requirements: 9.1, 9.3, 9.4, 10.1, 10.2_


- [x] 5. Enhance IBedrockAgentService with document parsing method

  - Add `ParseAndStructureResumeAsync(string s3Url)` method signature
  - Define return type as `Task<ParsedResumeResult>`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_


- [x] 6. Implement Bedrock document parsing in BedrockAgentService

  - Implement `ParseAndStructureResumeAsync` using AWS Bedrock Runtime
  - Configure Bedrock to use Textract for document extraction
  - Create prompt for Claude to structure extracted text into JSON
  - Parse Bedrock response into `ParsedResumeResult`
  - Add error handling for Bedrock API failures
  - Add logging for parsing operations
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 10.1, 10.4, 10.5_

- [x] 7. Create IResumeParsingService interface


  - Define `ParseResumeAsync` method signature
  - Define `GetLatestResumeContentAsync` method signature
  - Define `GetResumeHistoryAsync` method signature
  - _Requirements: 1.1, 2.1, 4.1_


- [x] 8. Implement ResumeParsingService orchestration logic

  - Create `ResumeParsingService` class with dependency injection
  - Implement `ParseResumeAsync` to orchestrate the parsing workflow
  - Create initial ResumeContent record with "pending" status
  - Call BedrockAgentService to parse document
  - Update status to "processing" during parsing
  - Save parsed content and plain text to database
  - Update status to "completed" on success
  - Update status to "failed" with error message on failure
  - Implement `GetLatestResumeContentAsync` to retrieve latest content
  - Implement `GetResumeHistoryAsync` to retrieve all versions
  - Add comprehensive error handling and logging
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 6.1, 6.2, 7.1, 7.2, 7.3, 7.4, 7.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 9. Register ResumeParsingService in dependency injection


  - Add service registration in Program.cs
  - Configure as scoped service
  - _Requirements: 1.1_


- [x] 10. Modify ResumeController upload endpoint to trigger parsing

  - Update `UploadResume` method to call ResumeParsingService
  - Pass S3 key, filename, content type, and file size to parsing service
  - Update response to include parsing status
  - Add error handling for parsing failures
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_


- [x] 11. Create GET /api/resume/content endpoint

  - Add `GetResumeContent` action method
  - Retrieve latest parsed content for authenticated user
  - Return 200 with JSON content if exists
  - Return 404 if no content exists
  - Return 202 if parsing is in progress
  - Return error details if parsing failed
  - Add authorization check
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 12. Create GET /api/resume/content/history endpoint


  - Add `GetResumeContentHistory` action method
  - Retrieve all parsed versions for authenticated user
  - Order by upload date descending
  - Return array of resume content records
  - Add authorization check
  - _Requirements: 2.2, 4.1_


- [x] 13. Create GET /api/resume/parsing-status endpoint

  - Add `GetParsingStatus` action method
  - Retrieve current parsing status for authenticated user
  - Return status, timestamp, and error if applicable
  - Add authorization check
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_


- [x] 14. Add configuration for resume parsing settings


  - Add `ResumeParsing` section to appsettings.json
  - Configure max file size, timeout, supported formats
  - Add configuration for Bedrock model selection
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 15. Write unit tests for ResumeParsingService
  - Test successful parsing workflow
  - Test error handling at each stage
  - Test status updates (pending → processing → completed/failed)
  - Mock BedrockAgentService and DataService
  - Test GetLatestResumeContentAsync
  - Test GetResumeHistoryAsync
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 16. Write unit tests for BedrockAgentService parsing method
  - Test document parsing with mock Bedrock responses
  - Test AI structuring with various resume formats
  - Test handling of incomplete information
  - Test JSON serialization/deserialization
  - Test error handling for Bedrock API failures
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 10.1, 10.2_

- [ ] 17. Write integration tests for resume upload and parsing
  - Test end-to-end upload and parsing workflow
  - Upload sample resume and verify parsing triggered
  - Verify content stored in database with correct structure
  - Verify status updates throughout process
  - Test with PDF, DOC, and DOCX files
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 5.1, 5.2, 5.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 18. Write integration tests for resume content retrieval
  - Upload and parse sample resume
  - Retrieve content via GET /api/resume/content
  - Verify JSON structure matches expected format
  - Test 404 response when no content exists
  - Test 202 response when parsing in progress
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 19. Write integration tests for resume update and re-parsing
  - Upload initial resume and verify parsing
  - Upload updated resume
  - Verify new parsing record created
  - Verify history maintained with both versions
  - Verify latest version is returned by default
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 20. Create sample test resume files
  - Create sample-resume.pdf with well-formatted content
  - Create sample-resume.docx with well-formatted content
  - Create complex-resume.pdf with tables and multiple pages
  - Create minimal-resume.pdf with basic information
  - Add test files to test fixtures directory
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 21. Add error handling and logging throughout





  - Add try-catch blocks in all service methods
  - Log parsing start, success, and failure events
  - Log processing time for performance monitoring
  - Add structured logging with user context
  - Ensure user-friendly error messages returned to API
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 22. Update API documentation
  - Document new endpoints in Swagger
  - Add request/response examples
  - Document error codes and messages
  - Add authentication requirements
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 23. Manual testing and validation
  - Test upload and parsing with real resume files
  - Verify JSON structure is correct and complete
  - Test error scenarios (corrupted files, network failures)
  - Verify status updates work correctly
  - Test retrieval endpoints with various scenarios
  - Verify authorization works correctly
  - _Requirements: All requirements_

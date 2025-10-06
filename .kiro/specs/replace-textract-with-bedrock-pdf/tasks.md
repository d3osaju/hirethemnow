# Implementation Plan

- [x] 1. Add PdfPig NuGet package and update configuration





  - Add PdfPig NuGet package to `HireThemNoW.Server.csproj` (version 0.1.9)
  - Update `appsettings.json` to set `SupportedFormats` to only include `["pdf"]`
  - Keep `BedrockModelId` as `amazon.nova-pro-v1:0` (no change needed)
  - Add configuration validation at startup
  - _Requirements: 2.2, 6.2, 6.3_

- [x] 2. Add S3 document download method to BedrockAgentService





  - Create `DownloadDocumentFromS3Async(string bucketName, string objectKey)` method
  - Inject `IAmazonS3` client into BedrockAgentService constructor
  - Implement S3 GetObject call to download document bytes
  - Add error handling for S3 exceptions (NoSuchKey, AccessDenied, etc.)
  - Add logging for download operations
  - _Requirements: 1.1, 5.5_

- [x] 3. Create new PDF text extraction method using PdfPig





  - Create `ExtractTextFromPdfAsync(byte[] pdfBytes, string fileName)` method
  - Use PdfPig library to open PDF document from byte array
  - Extract text from all pages using `document.GetPages()` and `page.Text`
  - Combine all page text into a single string
  - Add error handling for corrupted/encrypted PDFs
  - Add logging for extraction operations
  - _Requirements: 1.2, 1.3_

- [x] 4. Modify ParseAndStructureResumeAsync to use PdfPig instead of Textract





  - Remove call to `ExtractTextFromDocumentAsync` (Textract method)
  - Add call to `DownloadDocumentFromS3Async` to get PDF bytes
  - Add file size validation (check against 5MB limit)
  - Add call to `ExtractTextFromPdfAsync` with downloaded bytes
  - Keep existing call to `StructureResumeWithClaudeAsync` (works with Nova)
  - Update error handling to use new error message helper
  - Update logging to reflect PdfPig-based extraction
  - Maintain backward-compatible return type `ParsedResumeResult`
  - _Requirements: 1.1, 1.2, 1.4, 4.1_

- [x] 5. Implement enhanced error handling





  - Create `GetUserFriendlyErrorMessage(Exception ex, string fileName)` helper method
  - Map Bedrock BadRequest errors to "corrupted/protected PDF" message
  - Map S3 errors to "unable to access file" message
  - Map timeout errors to "taking too long" message
  - Map file size errors to "file too large" message
  - Update all catch blocks to use the new error message helper
  - Ensure technical details are logged while user sees friendly messages
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6. Remove Textract dependencies from BedrockAgentService





  - Remove `IAmazonTextract` from constructor parameters
  - Remove `_textractClient` field
  - Delete `ExtractTextFromDocumentAsync` method
  - Remove `using Amazon.Textract` statements
  - Remove Textract-related error handling code
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 7. Update Program.cs to remove Textract service registration





  - Remove `IAmazonTextract` service registration line
  - Keep `IAmazonBedrockRuntime` service registration
  - Ensure `IAmazonS3` service is registered (should already exist)
  - Remove Textract-related configuration checks
  - _Requirements: 3.1, 3.4_

- [x] 8. Update IAM permissions in deployment script




  - Open `deploy-backend.ps1`
  - Remove `textract:DetectDocumentText` and `textract:AnalyzeDocument` from IAM policy
  - Keep `bedrock:InvokeModel` permission for Nova Pro (no changes needed)
  - Ensure `s3:GetObject` permission exists for document downloads (should already exist)
  - No new permissions needed - works with existing access
  - _Requirements: 3.4_

- [x] 9. Update error messages in ResumeParsingService





  - Update hardcoded error message in `ResumeParsingService.cs` line 165
  - Change from "PDF, DOC, or DOCX" to "PDF" only
  - Update error message to be more specific based on actual error type
  - _Requirements: 2.2, 5.2_

- [ ] 10. Add unit tests for new PDF parsing functionality
  - Create test for `DownloadDocumentFromS3Async` with valid S3 key
  - Create test for `DownloadDocumentFromS3Async` with invalid S3 key (should throw)
  - Create test for `ExtractTextFromPdfAsync` with valid PDF bytes
  - Create test for `ExtractTextFromPdfAsync` with corrupted PDF (should throw)
  - Create test for `ExtractTextFromPdfAsync` with encrypted PDF (should throw)
  - Create test for `GetUserFriendlyErrorMessage` with different exception types
  - Mock S3 client for isolated testing
  - _Requirements: 1.1, 1.2, 5.1, 5.2_

- [ ] 11. Add integration test for end-to-end PDF parsing
  - Create test that uploads a real PDF to S3
  - Trigger parsing via `ParseAndStructureResumeAsync`
  - Verify structured content is returned correctly
  - Verify parsing completes within acceptable time (< 15 seconds)
  - Clean up test files from S3 after test
  - _Requirements: 1.1, 1.2, 1.3, 4.1_

- [ ] 12. Test error scenarios
  - Create test with encrypted/password-protected PDF (should return appropriate error)
  - Create test with oversized file (> 5MB, should return size error)
  - Create test with corrupted PDF bytes (should return corrupted error)
  - Verify all error messages are user-friendly
  - Verify technical details are logged
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
- [x] 13. Update configuration documentation



- [ ] 13. Update configuration documentation

  - Update README or configuration docs to reflect PdfPig library usage
  - Document that only PDF files are supported
  - Document file size limit (5MB)
  - Remove references to Textract from documentation
  - Note that Nova Pro is used for structuring (no model change)
  - _Requirements: 2.2, 6.1, 6.4_

- [ ] 14. Deploy and verify in staging environment




  - Deploy updated code to staging
  - Verify PdfPig package is included in deployment
  - Test with sample PDF resumes (simple and complex)
  - Verify parsing success rate
  - Verify error handling works correctly
  - Check CloudWatch logs for any issues
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1_

- [ ] 15. Monitor and validate production deployment
  - Deploy to production
  - Monitor CloudWatch logs for errors
  - Test with real user uploads
  - Track parsing success rate (target: >95%)
  - Track average parsing time (target: <10 seconds)
  - Verify no Textract-related errors appear in logs
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 4.1, 7.1, 7.2, 7.3, 7.4_

# Requirements Document

## Introduction

The resume parsing system is experiencing failures where AWS Textract returns "Document Format Error: Textract cannot process this file type" for certain PDF files. Investigation shows that some PDFs may be image-based (scanned documents), corrupted, or in formats that Textract's DetectDocumentText API cannot handle. This spec addresses adding fallback text extraction methods, better error handling, and support for image-based PDFs using Textract's OCR capabilities or alternative PDF parsing libraries.

## Requirements

### Requirement 1: Enhanced File Format Validation

**User Story:** As a user, I want the system to validate my resume file before processing, so that I receive clear feedback if my file format is unsupported.

#### Acceptance Criteria

1. WHEN a resume is uploaded THEN the system SHALL validate the file extension is PDF, DOC, or DOCX
2. WHEN a PDF file is uploaded THEN the system SHALL verify it is a valid PDF format (not corrupted)
3. WHEN validation fails THEN the system SHALL return a user-friendly error message indicating the specific issue
4. WHEN validation succeeds THEN the system SHALL proceed with text extraction
5. IF a file appears corrupted THEN the error message SHALL suggest re-saving or re-exporting the document

### Requirement 2: Fallback Text Extraction Methods

**User Story:** As a user, I want my resume to be processed even if the primary extraction method fails, so that I don't have to re-upload my document.

#### Acceptance Criteria

1. WHEN Textract fails with a format error THEN the system SHALL attempt PDF text extraction using a PDF library
2. WHEN PDF library extraction fails THEN the system SHALL attempt OCR-based extraction as a last resort
3. WHEN all extraction methods fail THEN the system SHALL log the specific failure reasons
4. WHEN fallback extraction succeeds THEN the system SHALL log which method was successful
5. IF all methods fail THEN the system SHALL provide guidance on acceptable file formats

### Requirement 3: Improved Error Messages and User Feedback

**User Story:** As a user, I want clear error messages when my resume fails to parse, so that I know how to fix the issue.

#### Acceptance Criteria

1. WHEN Textract returns a format error THEN the user SHALL see "Failed to extract information from resume. Please ensure the file is a valid PDF, DOC, or DOCX document."
2. WHEN text extraction returns empty content THEN the user SHALL see "No text could be extracted. Your document may be image-based or corrupted."
3. WHEN Bedrock structuring fails THEN the user SHALL see "Resume text extracted but structuring failed. Please try again."
4. WHEN IAM permissions are missing THEN the system SHALL log detailed permission errors but show users a generic "service unavailable" message
5. IF the file is too large THEN the user SHALL see a message indicating the maximum file size

### Requirement 4: PDF Library Integration for Direct Extraction

**User Story:** As a developer, I want a PDF text extraction library integrated as a fallback, so that we can handle PDFs that Textract cannot process.

#### Acceptance Criteria

1. WHEN the system starts THEN it SHALL have a PDF text extraction library available (e.g., iTextSharp, PdfPig, or similar)
2. WHEN Textract fails THEN the system SHALL use the PDF library to extract text directly
3. WHEN using the PDF library THEN the system SHALL preserve text formatting and line breaks
4. WHEN PDF extraction succeeds THEN the extracted text SHALL be passed to Bedrock for structuring
5. IF the PDF library also fails THEN the system SHALL log the specific error and try the next fallback method

### Requirement 5: Textract Error Handling and Retry Logic

**User Story:** As a developer, I want robust error handling for Textract calls, so that transient errors don't cause permanent failures.

#### Acceptance Criteria

1. WHEN Textract returns a throttling error THEN the system SHALL retry with exponential backoff
2. WHEN Textract returns a format error THEN the system SHALL immediately try the fallback method without retrying
3. WHEN Textract returns a permission error THEN the system SHALL log the error and fail fast
4. WHEN Textract succeeds THEN the system SHALL log the extraction time and character count
5. IF Textract times out THEN the system SHALL retry once before falling back

### Requirement 6: Resume Content Record Status Management

**User Story:** As a user, I want to see accurate status updates for my resume processing, so that I know when it's complete or if there's an issue.

#### Acceptance Criteria

1. WHEN a resume is uploaded THEN the status SHALL be set to "pending"
2. WHEN processing starts THEN the status SHALL be updated to "processing"
3. WHEN processing completes successfully THEN the status SHALL be "completed"
4. WHEN processing fails THEN the status SHALL be "failed" with an error message
5. IF processing is retried THEN the status SHALL return to "processing"

### Requirement 7: Logging and Diagnostics

**User Story:** As a developer, I want detailed logging for resume parsing failures, so that I can diagnose and fix issues quickly.

#### Acceptance Criteria

1. WHEN text extraction starts THEN the system SHALL log the S3 bucket, key, and extraction method
2. WHEN an extraction method fails THEN the system SHALL log the specific error type and message
3. WHEN a fallback method is used THEN the system SHALL log which method succeeded
4. WHEN Bedrock structuring fails THEN the system SHALL log the prompt length and response
5. IF all methods fail THEN the system SHALL log a summary of all attempted methods and their errors


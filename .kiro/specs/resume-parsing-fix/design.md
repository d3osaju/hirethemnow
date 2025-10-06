# Design Document

## Overview

This design implements a multi-layered text extraction strategy for resume parsing that gracefully handles various PDF formats, including image-based and problematic PDFs. The solution adds fallback extraction methods while maintaining the existing Bedrock-based structuring pipeline.

## Architecture

### Current State
- Single extraction method: AWS Textract `DetectDocumentText`
- Fails on image-based or certain formatted PDFs
- No fallback mechanism
- Generic error messages to users

### Target State
- Multi-layered extraction strategy with 3 methods:
  1. **Primary**: AWS Textract `DetectDocumentText` (fast, text-based PDFs)
  2. **Fallback 1**: PdfPig library (direct PDF text extraction)
  3. **Fallback 2**: AWS Textract `AnalyzeDocument` with OCR (image-based PDFs)
- Automatic fallback on failure
- Detailed logging of which method succeeded
- User-friendly error messages with actionable guidance

## Components and Interfaces

### 1. Enhanced Text Extraction Service

**Location**: `HireThemNoW.Server/Services/BedrockAgentService.cs`

**New Method Signature**:
```csharp
private async Task<TextExtractionResult> ExtractTextWithFallbackAsync(
    string bucketName, 
    string objectKey)
{
    // Try methods in order, return first success
}
```

**TextExtractionResult Model**:
```csharp
public class TextExtractionResult
{
    public bool Success { get; set; }
    public string Text { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty; // "Textract", "PdfPig", "TextractOCR"
    public string? ErrorMessage { get; set; }
    public TimeSpan ExtractionTime { get; set; }
}
```

### 2. Extraction Methods

#### Method 1: Textract DetectDocumentText (Current)

**When to use**: First attempt for all PDFs
**Advantages**: Fast, handles text-based PDFs well
**Limitations**: Fails on image-based PDFs, some PDF formats

**Implementation** (existing, with enhancements):
```csharp
private async Task<TextExtractionResult> ExtractWithTextractAsync(
    string bucketName, 
    string objectKey)
{
    var startTime = DateTime.UtcNow;
    try
    {
        var request = new DetectDocumentTextRequest
        {
            Document = new Document
            {
                S3Object = new Amazon.Textract.Model.S3Object
                {
                    Bucket = bucketName,
                    Name = objectKey
                }
            }
        };

        var response = await _textractClient.DetectDocumentTextAsync(request);

        var textBuilder = new StringBuilder();
        foreach (var block in response.Blocks)
        {
            if (block.BlockType == BlockType.LINE)
            {
                textBuilder.AppendLine(block.Text);
            }
        }

        var text = textBuilder.ToString();
        var extractionTime = DateTime.UtcNow - startTime;

        return new TextExtractionResult
        {
            Success = !string.IsNullOrWhiteSpace(text),
            Text = text,
            Method = "Textract-DetectDocumentText",
            ExtractionTime = extractionTime
        };
    }
    catch (AmazonTextractException ex) when (
        ex.ErrorCode == "UnsupportedDocumentException" || 
        ex.Message.Contains("format"))
    {
        _logger.LogWarning(ex,
            "Textract DetectDocumentText cannot process document format: {Bucket}/{Key}",
            bucketName, objectKey);
        
        return new TextExtractionResult
        {
            Success = false,
            ErrorMessage = $"Textract format error: {ex.Message}",
            ExtractionTime = DateTime.UtcNow - startTime
        };
    }
    catch (Exception ex)
    {
        _logger.LogError(ex,
            "Textract DetectDocumentText failed: {Bucket}/{Key}",
            bucketName, objectKey);
        
        return new TextExtractionResult
        {
            Success = false,
            ErrorMessage = ex.Message,
            ExtractionTime = DateTime.UtcNow - startTime
        };
    }
}
```

#### Method 2: PdfPig Library (New)

**When to use**: Fallback when Textract fails
**Advantages**: Handles many PDF formats, no AWS API calls
**Limitations**: Doesn't work on image-based PDFs

**NuGet Package**: `UglyToad.PdfPig` (version 0.1.8 or later)

**Implementation**:
```csharp
private async Task<TextExtractionResult> ExtractWithPdfPigAsync(
    string bucketName, 
    string objectKey)
{
    var startTime = DateTime.UtcNow;
    try
    {
        _logger.LogInformation(
            "Attempting PDF text extraction with PdfPig for {Bucket}/{Key}",
            bucketName, objectKey);

        // Download PDF from S3
        using var s3Stream = await DownloadFromS3Async(bucketName, objectKey);
        using var memoryStream = new MemoryStream();
        await s3Stream.CopyToAsync(memoryStream);
        memoryStream.Position = 0;

        // Extract text using PdfPig
        using var document = PdfDocument.Open(memoryStream);
        var textBuilder = new StringBuilder();

        foreach (var page in document.GetPages())
        {
            var pageText = page.Text;
            if (!string.IsNullOrWhiteSpace(pageText))
            {
                textBuilder.AppendLine(pageText);
            }
        }

        var text = textBuilder.ToString();
        var extractionTime = DateTime.UtcNow - startTime;

        if (string.IsNullOrWhiteSpace(text))
        {
            _logger.LogWarning(
                "PdfPig extracted no text from {Bucket}/{Key} - may be image-based PDF",
                bucketName, objectKey);
            
            return new TextExtractionResult
            {
                Success = false,
                ErrorMessage = "PDF contains no extractable text (may be image-based)",
                ExtractionTime = extractionTime
            };
        }

        _logger.LogInformation(
            "PdfPig successfully extracted {Length} characters from {Bucket}/{Key} in {Time:F2}s",
            text.Length, bucketName, objectKey, extractionTime.TotalSeconds);

        return new TextExtractionResult
        {
            Success = true,
            Text = text,
            Method = "PdfPig",
            ExtractionTime = extractionTime
        };
    }
    catch (Exception ex)
    {
        _logger.LogError(ex,
            "PdfPig extraction failed for {Bucket}/{Key}",
            bucketName, objectKey);
        
        return new TextExtractionResult
        {
            Success = false,
            ErrorMessage = $"PdfPig error: {ex.Message}",
            ExtractionTime = DateTime.UtcNow - startTime
        };
    }
}

private async Task<Stream> DownloadFromS3Async(string bucketName, string objectKey)
{
    var request = new Amazon.S3.Model.GetObjectRequest
    {
        BucketName = bucketName,
        Key = objectKey
    };

    var response = await _s3Client.GetObjectAsync(request);
    return response.ResponseStream;
}
```

#### Method 3: Textract AnalyzeDocument with OCR (New)

**When to use**: Last resort for image-based PDFs
**Advantages**: OCR capability, handles scanned documents
**Limitations**: Slower, more expensive, requires additional IAM permissions

**IAM Permission Required**: `textract:AnalyzeDocument`

**Implementation**:
```csharp
private async Task<TextExtractionResult> ExtractWithTextractOCRAsync(
    string bucketName, 
    string objectKey)
{
    var startTime = DateTime.UtcNow;
    try
    {
        _logger.LogInformation(
            "Attempting OCR extraction with Textract AnalyzeDocument for {Bucket}/{Key}",
            bucketName, objectKey);

        var request = new AnalyzeDocumentRequest
        {
            Document = new Document
            {
                S3Object = new Amazon.Textract.Model.S3Object
                {
                    Bucket = bucketName,
                    Name = objectKey
                }
            },
            FeatureTypes = new List<string> { "TABLES", "FORMS" }
        };

        var response = await _textractClient.AnalyzeDocumentAsync(request);

        var textBuilder = new StringBuilder();
        foreach (var block in response.Blocks)
        {
            if (block.BlockType == BlockType.LINE)
            {
                textBuilder.AppendLine(block.Text);
            }
        }

        var text = textBuilder.ToString();
        var extractionTime = DateTime.UtcNow - startTime;

        if (string.IsNullOrWhiteSpace(text))
        {
            _logger.LogWarning(
                "Textract OCR extracted no text from {Bucket}/{Key}",
                bucketName, objectKey);
            
            return new TextExtractionResult
            {
                Success = false,
                ErrorMessage = "OCR extraction returned no text",
                ExtractionTime = extractionTime
            };
        }

        _logger.LogInformation(
            "Textract OCR successfully extracted {Length} characters from {Bucket}/{Key} in {Time:F2}s",
            text.Length, bucketName, objectKey, extractionTime.TotalSeconds);

        return new TextExtractionResult
        {
            Success = true,
            Text = text,
            Method = "Textract-AnalyzeDocument-OCR",
            ExtractionTime = extractionTime
        };
    }
    catch (AmazonTextractException ex) when (ex.StatusCode == System.Net.HttpStatusCode.Forbidden)
    {
        _logger.LogWarning(ex,
            "Access denied to Textract AnalyzeDocument. IAM permissions may be missing for textract:AnalyzeDocument");
        
        return new TextExtractionResult
        {
            Success = false,
            ErrorMessage = "OCR not available (permission denied)",
            ExtractionTime = DateTime.UtcNow - startTime
        };
    }
    catch (Exception ex)
    {
        _logger.LogError(ex,
            "Textract OCR extraction failed for {Bucket}/{Key}",
            bucketName, objectKey);
        
        return new TextExtractionResult
        {
            Success = false,
            ErrorMessage = $"Textract OCR error: {ex.Message}",
            ExtractionTime = DateTime.UtcNow - startTime
        };
    }
}
```

### 3. Orchestration Logic

**Main extraction method with fallback**:
```csharp
private async Task<TextExtractionResult> ExtractTextWithFallbackAsync(
    string bucketName, 
    string objectKey)
{
    _logger.LogInformation(
        "Starting multi-method text extraction for {Bucket}/{Key}",
        bucketName, objectKey);

    var allErrors = new List<string>();

    // Method 1: Textract DetectDocumentText (fast, text-based PDFs)
    var result = await ExtractWithTextractAsync(bucketName, objectKey);
    if (result.Success)
    {
        _logger.LogInformation(
            "Text extraction succeeded with {Method} in {Time:F2}s",
            result.Method, result.ExtractionTime.TotalSeconds);
        return result;
    }
    allErrors.Add($"{result.Method}: {result.ErrorMessage}");
    _logger.LogWarning("Method 1 (Textract) failed, trying fallback methods");

    // Method 2: PdfPig (direct PDF parsing)
    result = await ExtractWithPdfPigAsync(bucketName, objectKey);
    if (result.Success)
    {
        _logger.LogInformation(
            "Text extraction succeeded with {Method} in {Time:F2}s",
            result.Method, result.ExtractionTime.TotalSeconds);
        return result;
    }
    allErrors.Add($"{result.Method}: {result.ErrorMessage}");
    _logger.LogWarning("Method 2 (PdfPig) failed, trying final fallback");

    // Method 3: Textract AnalyzeDocument with OCR (image-based PDFs)
    result = await ExtractWithTextractOCRAsync(bucketName, objectKey);
    if (result.Success)
    {
        _logger.LogInformation(
            "Text extraction succeeded with {Method} in {Time:F2}s",
            result.Method, result.ExtractionTime.TotalSeconds);
        return result;
    }
    allErrors.Add($"{result.Method}: {result.ErrorMessage}");

    // All methods failed
    var combinedErrors = string.Join("; ", allErrors);
    _logger.LogError(
        "All text extraction methods failed for {Bucket}/{Key}. Errors: {Errors}",
        bucketName, objectKey, combinedErrors);

    return new TextExtractionResult
    {
        Success = false,
        ErrorMessage = "All extraction methods failed. " +
                      "Please ensure your PDF is not corrupted and contains readable text or images.",
        ExtractionTime = TimeSpan.Zero
    };
}
```

### 4. Integration with Existing Code

**Update `ParseAndStructureResumeAsync` method**:

Replace the existing `ExtractTextFromDocumentAsync` call with:

```csharp
// Step 1: Extract text using multi-method approach
var extractStartTime = DateTime.UtcNow;
_logger.LogInformation("Starting text extraction from document using multi-method approach");

var extractionResult = await ExtractTextWithFallbackAsync(bucketName, objectKey);

if (!extractionResult.Success)
{
    _logger.LogWarning("Text extraction failed: {Error}", extractionResult.ErrorMessage);
    return new ParsedResumeResult
    {
        Success = false,
        ErrorMessage = extractionResult.ErrorMessage,
        PlainText = string.Empty,
        StructuredContent = new StructuredResumeContent()
    };
}

var plainText = extractionResult.Text;
var extractTime = extractionResult.ExtractionTime.TotalSeconds;

_logger.LogInformation(
    "Text extraction completed using {Method} in {ExtractTime:F2}s, extracted {TextLength} characters",
    extractionResult.Method, extractTime, plainText.Length);
```

### 5. Dependency Injection Updates

**Add IAmazonS3 to BedrockAgentService**:

```csharp
public class BedrockAgentService : IBedrockAgentService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<BedrockAgentService> _logger;
    private readonly IAmazonBedrockRuntime _bedrockClient;
    private readonly IAmazonTextract _textractClient;
    private readonly IAmazonS3 _s3Client; // NEW
    private readonly IConfiguration _configuration;

    public BedrockAgentService(
        ApplicationDbContext context,
        ILogger<BedrockAgentService> logger,
        IAmazonBedrockRuntime bedrockClient,
        IAmazonTextract textractClient,
        IAmazonS3 s3Client, // NEW
        IConfiguration configuration)
    {
        _context = context;
        _logger = logger;
        _bedrockClient = bedrockClient;
        _textractClient = textractClient;
        _s3Client = s3Client; // NEW
        _configuration = configuration;
    }
    
    // ... rest of implementation
}
```

## Data Models

### TextExtractionResult

```csharp
public class TextExtractionResult
{
    public bool Success { get; set; }
    public string Text { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
    public TimeSpan ExtractionTime { get; set; }
}
```

### ParsedResumeResult (existing, no changes needed)

Already defined in the codebase with Success, ErrorMessage, PlainText, and StructuredContent properties.

## Error Handling

### User-Facing Error Messages

| Scenario | User Message |
|----------|-------------|
| All methods fail | "Failed to extract text from your resume. Please ensure the file is not corrupted and contains readable text or images." |
| Empty text extracted | "No text could be extracted from your resume. Your document may be blank or heavily image-based without text." |
| Bedrock structuring fails | "Resume text extracted but structuring failed. Please try uploading again." |
| File too large | "File size exceeds the maximum limit of 5MB." |
| Invalid file type | "Invalid file type. Only PDF, DOC, and DOCX files are supported." |

### Logging Strategy

**Success Logging**:
```
[INFO] Starting multi-method text extraction for hirethemnow-files/resumes/2025/10/06/abc123.pdf
[INFO] Text extraction succeeded with PdfPig in 1.23s
[INFO] Extracted 2,450 characters
```

**Failure Logging**:
```
[WARN] Method 1 (Textract-DetectDocumentText) failed: UnsupportedDocumentException
[WARN] Method 2 (PdfPig) failed: PDF contains no extractable text
[INFO] Text extraction succeeded with Textract-AnalyzeDocument-OCR in 3.45s
```

**Complete Failure Logging**:
```
[ERROR] All text extraction methods failed for hirethemnow-files/resumes/2025/10/06/abc123.pdf
[ERROR] Errors: Textract: format error; PdfPig: no text; TextractOCR: permission denied
```

## Testing Strategy

### Unit Tests

1. **Test each extraction method independently**:
   - Mock AWS clients
   - Test success and failure scenarios
   - Verify error handling

2. **Test fallback logic**:
   - Simulate first method failure, second success
   - Simulate all methods failing
   - Verify correct method is logged

### Integration Tests

1. **Test with various PDF types**:
   - Text-based PDF (should use Textract)
   - Image-based PDF (should fall back to OCR)
   - Corrupted PDF (should fail gracefully)
   - Empty PDF (should return appropriate error)

2. **Test end-to-end flow**:
   - Upload resume
   - Verify background service processes it
   - Check database status updates
   - Verify parsed content structure

### Manual Testing

1. **Upload test PDFs**:
   - Standard text-based resume
   - Scanned resume (image-based)
   - Resume with mixed content
   - Intentionally corrupted PDF

2. **Monitor logs** for:
   - Which extraction method succeeded
   - Extraction times
   - Error messages

3. **Verify user experience**:
   - Check status updates in UI
   - Verify error messages are user-friendly
   - Confirm parsed content is accurate

## Performance Considerations

### Extraction Method Performance

| Method | Typical Time | Cost | Best For |
|--------|-------------|------|----------|
| Textract DetectDocumentText | 0.5-2s | $0.0015/page | Text-based PDFs |
| PdfPig | 0.2-1s | Free | Any PDF with extractable text |
| Textract AnalyzeDocument | 2-5s | $0.05/page | Image-based/scanned PDFs |

### Optimization Strategies

1. **Fast path for text-based PDFs**: Most resumes are text-based, so Textract will succeed quickly
2. **Avoid unnecessary S3 downloads**: Only download for PdfPig method
3. **Parallel processing**: Background service already handles multiple resumes concurrently
4. **Caching**: Consider caching extraction results if same file is processed multiple times

## Security Considerations

1. **IAM Permissions**: Add `textract:AnalyzeDocument` to existing IAM policy
2. **S3 Access**: Ensure `s3:GetObject` permission exists (already configured)
3. **File Validation**: Existing validation for file type and size remains
4. **Memory Management**: Dispose streams properly to avoid memory leaks
5. **Error Information**: Don't expose internal AWS errors to end users

## Deployment Steps

1. **Add NuGet package**: `dotnet add package UglyToad.PdfPig`
2. **Update IAM policy**: Add `textract:AnalyzeDocument` permission
3. **Deploy code changes**: Run `deploy-backend.ps1`
4. **Test with sample PDFs**: Upload various PDF types
5. **Monitor logs**: Verify fallback methods are working

## Rollback Plan

If issues occur:

1. **Revert to single method**: Comment out fallback methods, use only Textract
2. **Remove PdfPig dependency**: If library causes issues
3. **Disable OCR fallback**: If costs are too high
4. **Redeploy previous version**: Use Elastic Beanstalk version management


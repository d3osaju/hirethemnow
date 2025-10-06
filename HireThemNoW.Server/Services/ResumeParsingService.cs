using HireThemNoW.Server.Models;
using System.Text.Json;

namespace HireThemNoW.Server.Services;

public class ResumeParsingService : IResumeParsingService
{
    private readonly IDataService _dataService;
    private readonly IBedrockAgentService _bedrockService;
    private readonly ILogger<ResumeParsingService> _logger;
    private readonly IConfiguration _configuration;

    public ResumeParsingService(
        IDataService dataService,
        IBedrockAgentService bedrockService,
        ILogger<ResumeParsingService> logger,
        IConfiguration configuration)
    {
        _dataService = dataService;
        _bedrockService = bedrockService;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task<ResumeContent> ParseResumeAsync(string userId, string s3Key, string fileName, string contentType, long fileSizeBytes)
    {
        var startTime = DateTime.UtcNow;
        _logger.LogInformation(
            "Starting resume parsing for user {UserId}, file: {FileName}, size: {FileSizeBytes} bytes, type: {ContentType}",
            userId, fileName, fileSizeBytes, contentType);

        // Create initial resume content record with pending status
        var resumeContent = new ResumeContent
        {
            UserId = userId,
            S3Key = s3Key,
            FileName = fileName,
            ContentType = contentType,
            FileSizeBytes = fileSizeBytes,
            ParsingStatus = "pending",
            ParsedContent = string.Empty,
            UploadedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        try
        {
            // Save initial record
            try
            {
                resumeContent = await _dataService.SaveResumeContentAsync(resumeContent);
                _logger.LogInformation(
                    "Created resume content record with ID {ResumeContentId} for user {UserId}",
                    resumeContent.Id, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to create initial resume content record for user {UserId}, file: {FileName}",
                    userId, fileName);
                throw new InvalidOperationException("Failed to initialize resume parsing record. Please try again.", ex);
            }

            // Update status to processing
            try
            {
                await _dataService.UpdateResumeContentStatusAsync(resumeContent.Id, "processing");
                _logger.LogInformation(
                    "Updated status to processing for resume content ID {ResumeContentId}, user {UserId}",
                    resumeContent.Id, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to update status to processing for resume content ID {ResumeContentId}, user {UserId}",
                    resumeContent.Id, userId);
                // Continue processing even if status update fails
            }

            // Build S3 URL
            var bucketName = _configuration["AWS:S3:BucketName"] ?? "hirethemnow-files";
            var s3Url = $"s3://{bucketName}/{s3Key}";
            _logger.LogDebug("Built S3 URL: {S3Url} for resume content ID {ResumeContentId}", s3Url, resumeContent.Id);

            // Call Bedrock to parse and structure the resume
            var parsingStartTime = DateTime.UtcNow;
            _logger.LogInformation(
                "Invoking Bedrock parsing service for resume content ID {ResumeContentId}, user {UserId}",
                resumeContent.Id, userId);

            ParsedResumeResult parseResult;
            try
            {
                parseResult = await _bedrockService.ParseAndStructureResumeAsync(s3Url);
                var parsingTime = (DateTime.UtcNow - parsingStartTime).TotalSeconds;

                _logger.LogInformation(
                    "Bedrock parsing completed in {ParsingTime:F2}s for resume content ID {ResumeContentId}, user {UserId}, success: {Success}",
                    parsingTime, resumeContent.Id, userId, parseResult.Success);

                // Log warning if parsing took too long
                var timeoutThreshold = _configuration.GetValue<int>("ResumeParsing:ParsingTimeoutSeconds", 30);
                if (parsingTime > timeoutThreshold * 0.8) // Warn at 80% of timeout
                {
                    _logger.LogWarning(
                        "Resume parsing took {ParsingTime:F2}s, approaching timeout threshold of {TimeoutThreshold}s for resume content ID {ResumeContentId}, user {UserId}",
                        parsingTime, timeoutThreshold, resumeContent.Id, userId);
                }
            }
            catch (Exception ex)
            {
                var parsingTime = (DateTime.UtcNow - parsingStartTime).TotalSeconds;
                _logger.LogError(ex,
                    "Bedrock parsing failed after {ParsingTime:F2}s for resume content ID {ResumeContentId}, user {UserId}, file: {FileName}",
                    parsingTime, resumeContent.Id, userId, fileName);

                var userFriendlyMessage = "Failed to parse resume document. The file may be corrupted or in an unsupported format.";
                await _dataService.UpdateResumeContentStatusAsync(resumeContent.Id, "failed", userFriendlyMessage);

                resumeContent.ParsingStatus = "failed";
                resumeContent.ParsingError = userFriendlyMessage;
                return resumeContent;
            }

            if (parseResult.Success)
            {
                try
                {
                    // Serialize structured content to JSON
                    var parsedContentJson = JsonSerializer.Serialize(parseResult.StructuredContent, new JsonSerializerOptions
                    {
                        WriteIndented = true
                    });

                    _logger.LogDebug(
                        "Serialized structured content, size: {JsonSize} bytes for resume content ID {ResumeContentId}",
                        parsedContentJson.Length, resumeContent.Id);

                    // Update the resume content with parsed data
                    resumeContent.ParsedContent = parsedContentJson;
                    resumeContent.TextContent = parseResult.PlainText;
                    resumeContent.ParsingStatus = "completed";
                    resumeContent.ParsedAt = DateTime.UtcNow;
                    resumeContent.UpdatedAt = DateTime.UtcNow;

                    await _dataService.UpdateResumeContentStatusAsync(resumeContent.Id, "completed");

                    var totalTime = (DateTime.UtcNow - startTime).TotalSeconds;
                    _logger.LogInformation(
                        "Successfully parsed and stored resume content for user {UserId}, resume content ID {ResumeContentId}, total time: {TotalTime:F2}s",
                        userId, resumeContent.Id, totalTime);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "Failed to save parsed content for resume content ID {ResumeContentId}, user {UserId}",
                        resumeContent.Id, userId);

                    var userFriendlyMessage = "Failed to save parsed resume content. Please try uploading again.";
                    await _dataService.UpdateResumeContentStatusAsync(resumeContent.Id, "failed", userFriendlyMessage);

                    resumeContent.ParsingStatus = "failed";
                    resumeContent.ParsingError = userFriendlyMessage;
                    return resumeContent;
                }
            }
            else
            {
                // Parsing failed
                var errorMessage = parseResult.ErrorMessage ?? "Unknown error during parsing";
                
                // Use the specific error message from the parsing result if available,
                // otherwise provide a generic message
                var userFriendlyMessage = !string.IsNullOrEmpty(parseResult.ErrorMessage)
                    ? parseResult.ErrorMessage
                    : "Failed to extract information from resume. Please ensure the file is a valid PDF document.";

                _logger.LogWarning(
                    "Resume parsing failed for user {UserId}, resume content ID {ResumeContentId}: {ErrorMessage}",
                    userId, resumeContent.Id, errorMessage);

                await _dataService.UpdateResumeContentStatusAsync(resumeContent.Id, "failed", userFriendlyMessage);

                resumeContent.ParsingStatus = "failed";
                resumeContent.ParsingError = userFriendlyMessage;
            }

            // Retrieve updated record
            var updatedContent = await _dataService.GetLatestResumeContentAsync(userId);
            return updatedContent ?? resumeContent;
        }
        catch (Exception ex)
        {
            var totalTime = (DateTime.UtcNow - startTime).TotalSeconds;
            _logger.LogError(ex,
                "Unexpected error parsing resume for user {UserId}, file: {FileName}, time elapsed: {TotalTime:F2}s",
                userId, fileName, totalTime);

            // Update status to failed with user-friendly message
            var userFriendlyMessage = "An unexpected error occurred while parsing your resume. Please try again or contact support if the issue persists.";
            try
            {
                if (resumeContent.Id > 0)
                {
                    await _dataService.UpdateResumeContentStatusAsync(resumeContent.Id, "failed", userFriendlyMessage);
                }
            }
            catch (Exception updateEx)
            {
                _logger.LogError(updateEx,
                    "Failed to update resume content status to failed for ID {ResumeContentId}, user {UserId}",
                    resumeContent.Id, userId);
            }

            resumeContent.ParsingStatus = "failed";
            resumeContent.ParsingError = userFriendlyMessage;

            return resumeContent;
        }
    }

    public async Task<ResumeContent?> GetLatestResumeContentAsync(string userId)
    {
        _logger.LogInformation("Retrieving latest resume content for user {UserId}", userId);

        try
        {
            var content = await _dataService.GetLatestResumeContentAsync(userId);

            if (content != null)
            {
                _logger.LogInformation(
                    "Retrieved latest resume content ID {ResumeContentId} for user {UserId}, status: {Status}",
                    content.Id, userId, content.ParsingStatus);
            }
            else
            {
                _logger.LogInformation("No resume content found for user {UserId}", userId);
            }

            return content;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving latest resume content for user {UserId}", userId);
            throw new InvalidOperationException("Failed to retrieve resume content. Please try again.", ex);
        }
    }

    public async Task<List<ResumeContent>> GetResumeHistoryAsync(string userId)
    {
        _logger.LogInformation("Retrieving resume history for user {UserId}", userId);

        try
        {
            var history = await _dataService.GetResumeContentHistoryAsync(userId);

            _logger.LogInformation(
                "Retrieved {Count} resume content records for user {UserId}",
                history.Count, userId);

            return history;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving resume history for user {UserId}", userId);
            throw new InvalidOperationException("Failed to retrieve resume history. Please try again.", ex);
        }
    }
}

using HireThemNoW.Server.Data;
using HireThemNoW.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace HireThemNoW.Server.Services;

public class ResumeParsingBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ResumeParsingBackgroundService> _logger;
    private readonly IConfiguration _configuration;
    private readonly TimeSpan _pollingInterval;
    private readonly int _maxConcurrentProcessing;

    public ResumeParsingBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<ResumeParsingBackgroundService> logger,
        IConfiguration configuration)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _configuration = configuration;
        
        // Get configuration values
        var pollingSeconds = _configuration.GetValue<int>("ResumeParsing:PollingIntervalSeconds", 10);
        _pollingInterval = TimeSpan.FromSeconds(pollingSeconds);
        _maxConcurrentProcessing = _configuration.GetValue<int>("ResumeParsing:MaxConcurrentProcessing", 3);
        
        _logger.LogInformation(
            "Resume parsing background service initialized with polling interval: {PollingInterval}s, max concurrent: {MaxConcurrent}",
            pollingSeconds, _maxConcurrentProcessing);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Resume parsing background service starting");

        // Validate configuration
        var modelId = _configuration["ResumeParsing:BedrockModelId"];
        var bucketName = _configuration["AWS:S3:BucketName"];
        
        if (string.IsNullOrEmpty(modelId))
        {
            _logger.LogError("ResumeParsing:BedrockModelId is not configured. Resume parsing may fail.");
        }
        else
        {
            _logger.LogInformation("Using Bedrock model: {ModelId}", modelId);
        }
        
        if (string.IsNullOrEmpty(bucketName))
        {
            _logger.LogError("AWS:S3:BucketName is not configured. Resume parsing may fail.");
        }
        else
        {
            _logger.LogInformation("Using S3 bucket: {BucketName}", bucketName);
        }

        // Check if background processing is enabled
        var isEnabled = _configuration.GetValue<bool>("ResumeParsing:EnableBackgroundProcessing", false);
        if (!isEnabled)
        {
            _logger.LogWarning("Resume parsing background service is disabled in configuration. Set ResumeParsing:EnableBackgroundProcessing to true to enable.");
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPendingResumesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in resume parsing background service main loop");
            }

            // Wait before next polling cycle
            await Task.Delay(_pollingInterval, stoppingToken);
        }

        _logger.LogInformation("Resume parsing background service stopping");
    }

    private async Task ProcessPendingResumesAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        try
        {
            // Find pending resume content records
            var pendingResumes = await context.ResumeContents
                .Where(rc => rc.ParsingStatus == "pending")
                .OrderBy(rc => rc.UploadedAt)
                .Take(_maxConcurrentProcessing)
                .ToListAsync(stoppingToken);

            if (pendingResumes.Count == 0)
            {
                _logger.LogDebug("No pending resumes found for processing");
                return;
            }

            _logger.LogInformation("Found {Count} pending resume(s) to process", pendingResumes.Count);

            // Process each resume
            var tasks = pendingResumes.Select(resume => ProcessResumeAsync(resume, stoppingToken));
            await Task.WhenAll(tasks);
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Resume processing cancelled");
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error querying for pending resumes");
        }
    }

    private async Task ProcessResumeAsync(ResumeContent resumeContent, CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var parsingService = scope.ServiceProvider.GetRequiredService<IResumeParsingService>();
        var dataService = scope.ServiceProvider.GetRequiredService<IDataService>();
        var bedrockService = scope.ServiceProvider.GetRequiredService<IBedrockAgentService>();

        var startTime = DateTime.UtcNow;
        
        _logger.LogInformation(
            "Starting background processing for resume content ID {ResumeContentId}, user {UserId}, file: {FileName}",
            resumeContent.Id, resumeContent.UserId, resumeContent.FileName);

        try
        {
            // Update status to processing
            await dataService.UpdateResumeContentStatusAsync(resumeContent.Id, "processing");
            
            _logger.LogInformation(
                "Updated status to processing for resume content ID {ResumeContentId}",
                resumeContent.Id);

            // Build S3 URL
            var bucketName = _configuration["AWS:S3:BucketName"] ?? "hirethemnow-files";
            var s3Url = $"s3://{bucketName}/{resumeContent.S3Key}";

            _logger.LogDebug(
                "Built S3 URL: {S3Url} for resume content ID {ResumeContentId}",
                s3Url, resumeContent.Id);

            // Call Bedrock to parse and structure the resume
            var parsingStartTime = DateTime.UtcNow;
            var parseResult = await bedrockService.ParseAndStructureResumeAsync(s3Url);
            var parsingTime = (DateTime.UtcNow - parsingStartTime).TotalSeconds;

            _logger.LogInformation(
                "Bedrock parsing completed in {ParsingTime:F2}s for resume content ID {ResumeContentId}, success: {Success}",
                parsingTime, resumeContent.Id, parseResult.Success);

            if (parseResult.Success)
            {
                // Serialize structured content to JSON
                var parsedContentJson = System.Text.Json.JsonSerializer.Serialize(
                    parseResult.StructuredContent,
                    new System.Text.Json.JsonSerializerOptions { WriteIndented = true });

                // Update the resume content with parsed data
                resumeContent.ParsedContent = parsedContentJson;
                resumeContent.TextContent = parseResult.PlainText;
                resumeContent.ParsingStatus = "completed";
                resumeContent.ParsedAt = DateTime.UtcNow;
                resumeContent.UpdatedAt = DateTime.UtcNow;

                // Save to database
                using var updateScope = _serviceProvider.CreateScope();
                var updateContext = updateScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                updateContext.ResumeContents.Update(resumeContent);
                await updateContext.SaveChangesAsync(stoppingToken);

                var totalTime = (DateTime.UtcNow - startTime).TotalSeconds;
                _logger.LogInformation(
                    "Successfully completed background parsing for resume content ID {ResumeContentId}, user {UserId}, total time: {TotalTime:F2}s",
                    resumeContent.Id, resumeContent.UserId, totalTime);
            }
            else
            {
                // Parsing failed
                var errorMessage = parseResult.ErrorMessage ?? "Unknown error during parsing";
                var userFriendlyMessage = "Failed to extract information from resume. Please ensure the file is a valid PDF, DOC, or DOCX document.";

                await dataService.UpdateResumeContentStatusAsync(resumeContent.Id, "failed", userFriendlyMessage);

                _logger.LogWarning(
                    "Background parsing failed for resume content ID {ResumeContentId}, user {UserId}: {ErrorMessage}",
                    resumeContent.Id, resumeContent.UserId, errorMessage);
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation(
                "Background parsing cancelled for resume content ID {ResumeContentId}",
                resumeContent.Id);
            
            // Reset to pending so it can be retried
            await dataService.UpdateResumeContentStatusAsync(resumeContent.Id, "pending");
            throw;
        }
        catch (Exception ex)
        {
            var totalTime = (DateTime.UtcNow - startTime).TotalSeconds;
            _logger.LogError(ex,
                "Unexpected error in background parsing for resume content ID {ResumeContentId}, user {UserId}, time elapsed: {TotalTime:F2}s",
                resumeContent.Id, resumeContent.UserId, totalTime);

            // Update status to failed with user-friendly message
            var userFriendlyMessage = "An unexpected error occurred while parsing your resume. Please try uploading again.";
            try
            {
                await dataService.UpdateResumeContentStatusAsync(resumeContent.Id, "failed", userFriendlyMessage);
            }
            catch (Exception updateEx)
            {
                _logger.LogError(updateEx,
                    "Failed to update resume content status to failed for ID {ResumeContentId}",
                    resumeContent.Id);
            }
        }
    }
}

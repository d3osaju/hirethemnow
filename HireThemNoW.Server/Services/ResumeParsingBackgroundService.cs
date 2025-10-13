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
                // Call ProcessPendingResumesAsync first (parsing priority)
                var resumesProcessed = await ProcessPendingResumesAsync(stoppingToken);
                
                // Calculate available processing slots
                var availableSlots = _maxConcurrentProcessing - resumesProcessed;
                
                // Call ProcessPendingAnalysesAsync with remaining slots
                // Respect total MaxConcurrentProcessing limit
                if (availableSlots > 0)
                {
                    await ProcessPendingAnalysesAsync(availableSlots, stoppingToken);
                }
                else
                {
                    _logger.LogDebug("All {MaxConcurrent} processing slots used for resume parsing, skipping analysis processing this cycle", 
                        _maxConcurrentProcessing);
                }
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

    private async Task<int> ProcessPendingResumesAsync(CancellationToken stoppingToken)
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
                return 0;
            }

            _logger.LogInformation("Found {Count} pending resume(s) to process", pendingResumes.Count);

            // Process each resume
            var tasks = pendingResumes.Select(resume => ProcessResumeAsync(resume, stoppingToken));
            await Task.WhenAll(tasks);
            
            return pendingResumes.Count;
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Resume processing cancelled");
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error querying for pending resumes");
            return 0;
        }
    }

    private async Task ProcessPendingAnalysesAsync(int availableSlots, CancellationToken stoppingToken)
    {
        if (availableSlots <= 0)
        {
            _logger.LogDebug("No available slots for analysis processing");
            return;
        }

        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        try
        {
            // Query for ResumeAnalysis records with status "waiting_for_parsing"
            // Join with ResumeContents to check parsing status
            // Filter for completed parsing
            var waitingAnalyses = await context.ResumeAnalyses
                .Where(ra => ra.Status == "waiting_for_parsing")
                .Join(context.ResumeContents,
                    ra => ra.ResumeContentId,
                    rc => rc.Id,
                    (ra, rc) => new { Analysis = ra, Content = rc })
                .Where(x => x.Content.ParsingStatus == "completed")
                .Select(x => x.Analysis)
                .OrderBy(ra => ra.CreatedAt) // Order by creation date
                .Take(availableSlots) // Respect MaxConcurrentProcessing limit
                .ToListAsync(stoppingToken);

            if (waitingAnalyses.Count == 0)
            {
                _logger.LogDebug("No pending analyses found for processing");
                return;
            }

            _logger.LogInformation("Found {Count} pending analysis/analyses to process (available slots: {AvailableSlots})", 
                waitingAnalyses.Count, availableSlots);

            // Process each analysis asynchronously
            var tasks = waitingAnalyses.Select(analysis => ProcessAnalysisAsync(analysis, stoppingToken));
            await Task.WhenAll(tasks);
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Analysis processing cancelled");
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error querying for pending analyses");
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

                // Send parsing complete email notification
                try
                {
                    var emailService = updateScope.ServiceProvider.GetRequiredService<IEmailService>();
                    var user = await updateContext.Users.FindAsync(resumeContent.UserId);
                    if (user != null)
                    {
                        await emailService.SendParsingCompleteEmailAsync(user.Id, user.Email, user.Name);
                        _logger.LogInformation("Parsing complete email sent to user {UserId}", resumeContent.UserId);
                    }
                }
                catch (Exception emailEx)
                {
                    _logger.LogWarning(emailEx, "Failed to send parsing complete email to user {UserId}", resumeContent.UserId);
                    // Don't fail the parsing if email fails
                }
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

    private async Task ProcessAnalysisAsync(ResumeAnalysis analysis, CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var resumeAnalysisService = scope.ServiceProvider.GetRequiredService<IResumeAnalysisService>();

        var startTime = DateTime.UtcNow;
        
        _logger.LogInformation(
            "Starting background analysis processing for analysis ID {AnalysisId}, user {UserId}, resumeContentId {ResumeContentId}",
            analysis.Id, analysis.UserId, analysis.ResumeContentId);

        try
        {
            // Update analysis status to "processing"
            analysis.Status = "processing";
            analysis.UpdatedAt = DateTime.UtcNow;
            context.ResumeAnalyses.Update(analysis);
            await context.SaveChangesAsync(stoppingToken);
            
            _logger.LogInformation(
                "Updated status to processing for analysis ID {AnalysisId}",
                analysis.Id);

            // Get resumeContentId from analysis
            if (!analysis.ResumeContentId.HasValue)
            {
                throw new InvalidOperationException($"Analysis ID {analysis.Id} does not have a ResumeContentId");
            }

            var resumeContentId = analysis.ResumeContentId.Value;

            // Call ResumeAnalysisService.AnalyzeResumeAsync
            var analysisStartTime = DateTime.UtcNow;
            var updatedAnalysis = await resumeAnalysisService.AnalyzeResumeAsync(analysis.UserId, resumeContentId);
            var analysisTime = (DateTime.UtcNow - analysisStartTime).TotalSeconds;

            var totalTime = (DateTime.UtcNow - startTime).TotalSeconds;
            _logger.LogInformation(
                "Successfully completed background analysis for analysis ID {AnalysisId}, user {UserId}, analysis time: {AnalysisTime:F2}s, total time: {TotalTime:F2}s, overall score: {Score}",
                analysis.Id, analysis.UserId, analysisTime, totalTime, updatedAnalysis.AtsOverallScore);
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation(
                "Background analysis cancelled for analysis ID {AnalysisId}",
                analysis.Id);
            
            // Reset to waiting_for_parsing so it can be retried
            try
            {
                using var resetScope = _serviceProvider.CreateScope();
                var resetContext = resetScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                
                var analysisToReset = await resetContext.ResumeAnalyses.FindAsync(analysis.Id);
                if (analysisToReset != null)
                {
                    analysisToReset.Status = "waiting_for_parsing";
                    analysisToReset.UpdatedAt = DateTime.UtcNow;
                    resetContext.ResumeAnalyses.Update(analysisToReset);
                    await resetContext.SaveChangesAsync(CancellationToken.None);
                }
            }
            catch (Exception resetEx)
            {
                _logger.LogError(resetEx, "Failed to reset analysis status after cancellation for analysis ID {AnalysisId}", analysis.Id);
            }
            
            throw;
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("parsing is not complete"))
        {
            var totalTime = (DateTime.UtcNow - startTime).TotalSeconds;
            _logger.LogWarning(ex, 
                "Parsing not complete for analysis ID {AnalysisId}, user {UserId} after {TotalTime:F2}s - keeping status as waiting_for_parsing", 
                analysis.Id, analysis.UserId, totalTime);

            // Update status back to waiting_for_parsing and clear any error
            await HandleAnalysisErrorAsync(analysis.Id, "waiting_for_parsing", null, stoppingToken);
        }
        catch (Exception ex)
        {
            var totalTime = (DateTime.UtcNow - startTime).TotalSeconds;
            _logger.LogError(ex,
                "Unexpected error in background analysis for analysis ID {AnalysisId}, user {UserId}, time elapsed: {TotalTime:F2}s: {ErrorType}",
                analysis.Id, analysis.UserId, totalTime, ex.GetType().Name);

            // Handle errors and update status to "failed"
            var userFriendlyMessage = ex.Message.Contains("timeout") || ex.Message.Contains("took too long")
                ? "Analysis took too long. Please try again."
                : ex.Message.Contains("service") && ex.Message.Contains("unavailable")
                ? "Analysis service is temporarily unavailable. Please try again in a few minutes."
                : ex.Message.Contains("Invalid") && ex.Message.Contains("response")
                ? "Unable to analyze resume. Please re-upload your resume."
                : "An unexpected error occurred during analysis. Please try again.";

            await HandleAnalysisErrorAsync(analysis.Id, "failed", userFriendlyMessage, stoppingToken);
        }
    }

    private async Task HandleAnalysisErrorAsync(int analysisId, string status, string? errorMessage, CancellationToken stoppingToken)
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            
            var analysis = await context.ResumeAnalyses.FindAsync(analysisId);
            if (analysis != null)
            {
                analysis.Status = status;
                analysis.AnalysisError = errorMessage;
                analysis.UpdatedAt = DateTime.UtcNow;

                context.ResumeAnalyses.Update(analysis);
                await context.SaveChangesAsync(stoppingToken);

                _logger.LogInformation("Updated analysis status to '{Status}' for analysis ID {AnalysisId}, error: {Error}", 
                    status, analysisId, errorMessage ?? "none");

                // Send analysis failed email notification if status is failed
                if (status == "failed" && !string.IsNullOrEmpty(errorMessage))
                {
                    try
                    {
                        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
                        var user = await context.Users.FindAsync(analysis.UserId);
                        if (user != null)
                        {
                            await emailService.SendAnalysisFailedEmailAsync(user.Id, user.Email, user.Name, errorMessage);
                            _logger.LogInformation("Analysis failed email sent to user {UserId}", analysis.UserId);
                        }
                    }
                    catch (Exception emailEx)
                    {
                        _logger.LogWarning(emailEx, "Failed to send analysis failed email to user {UserId}", analysis.UserId);
                        // Don't fail the error handling if email fails
                    }
                }
            }
            else
            {
                _logger.LogWarning("Analysis ID {AnalysisId} not found when trying to update status to '{Status}'", 
                    analysisId, status);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update analysis status to '{Status}' for analysis ID {AnalysisId}", 
                status, analysisId);
        }
    }
}

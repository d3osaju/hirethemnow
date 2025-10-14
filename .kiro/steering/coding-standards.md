# Coding Standards and Best Practices

## Overview

This document outlines the coding standards, conventions, and best practices for the HireThemNow project. Following these guidelines ensures consistency, maintainability, and quality across the codebase.

## General Principles

1. **KISS** (Keep It Simple, Stupid) - Prefer simple solutions
2. **DRY** (Don't Repeat Yourself) - Avoid code duplication
3. **YAGNI** (You Aren't Gonna Need It) - Don't add unnecessary features
4. **SOLID** - Follow SOLID principles for OOP
5. **Clean Code** - Write self-documenting, readable code

---

## C# / .NET Backend Standards

### Naming Conventions

**PascalCase**:
- Classes: `UserController`, `ResumeParsingService`
- Methods: `GetUserAsync`, `UploadResume`
- Properties: `UserId`, `CreatedAt`
- Interfaces: `IDataService`, `IS3Service`

**camelCase**:
- Local variables: `userId`, `resumeContent`
- Method parameters: `fileName`, `contentType`
- Private fields: `_logger`, `_dataService`

**UPPER_CASE**:
- Constants: `MAX_FILE_SIZE`, `DEFAULT_TIMEOUT`

### File Organization

```
HireThemNoW.Server/
├── Controllers/        # API endpoints (one controller per resource)
├── Models/            # Data models and DTOs
├── Services/          # Business logic (interfaces + implementations)
├── Data/              # Database context and migrations
├── Migrations/        # EF Core migrations
└── Program.cs         # Application entry point
```

### Controller Standards

#### Basic Controller Pattern

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]  // Add if authentication required
public class UsersController : ControllerBase
{
    private readonly IDataService _dataService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IDataService dataService, ILogger<UsersController> logger)
    {
        _dataService = dataService;
        _logger = logger;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<User>>> GetUser(string id)
    {
        try
        {
            var user = await _dataService.GetUserAsync(id);
            
            if (user == null)
            {
                return NotFound(new ApiResponse<User>
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            return Ok(new ApiResponse<User>
            {
                Success = true,
                Message = "User retrieved successfully",
                Data = user
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user {UserId}", id);
            return StatusCode(500, new ApiResponse<User>
            {
                Success = false,
                Message = "An error occurred while retrieving the user",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}
```

#### Status-Based Response Patterns

For endpoints that handle asynchronous processing or different states, use status-based responses with appropriate HTTP status codes:

```csharp
[ApiController]
[Route("api/resume/analysis")]
[Authorize]
public class ResumeAnalysisController : ControllerBase
{
    private readonly IResumeAnalysisService _resumeAnalysisService;
    private readonly ILogger<ResumeAnalysisController> _logger;

    public ResumeAnalysisController(
        IResumeAnalysisService resumeAnalysisService,
        ILogger<ResumeAnalysisController> logger)
    {
        _resumeAnalysisService = resumeAnalysisService;
        _logger = logger;
    }

    /// <summary>
    /// Get analysis status with appropriate HTTP status codes based on processing state
    /// </summary>
    [HttpGet("status")]
    public async Task<ActionResult<ApiResponse<AnalysisStatusDto>>> GetAnalysisStatus()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        try
        {
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("Unauthorized access attempt to analysis status endpoint");
                return Unauthorized(new ApiResponse<AnalysisStatusDto>
                {
                    Success = false,
                    Message = "Authentication required. Please log in."
                });
            }

            _logger.LogInformation("Getting analysis status for user {UserId}", userId);

            var analysis = await _resumeAnalysisService.GetLatestAnalysisAsync(userId);

            if (analysis == null)
            {
                _logger.LogInformation("No analysis found for user {UserId}", userId);
                return NotFound(new ApiResponse<AnalysisStatusDto>
                {
                    Success = false,
                    Message = "No resume analysis found. Please upload a resume first."
                });
            }

            var statusDto = new AnalysisStatusDto
            {
                Status = analysis.Status,
                OverallScore = analysis.AtsOverallScore,
                CompletedAt = analysis.Status == "completed" ? analysis.ProcessedAt : null,
                ErrorMessage = analysis.AnalysisError
            };

            // ✅ Good - Dynamic messages based on status
            statusDto.Message = analysis.Status switch
            {
                "waiting_for_parsing" => "Your resume is being parsed. Analysis will begin automatically once parsing is complete.",
                "processing" => "Analyzing your resume for ATS compatibility. This usually takes 10-15 seconds.",
                "completed" => $"Analysis completed successfully! Your ATS score is {analysis.AtsOverallScore}/100.",
                "failed" => "Analysis failed. Please try again or contact support if the issue persists.",
                _ => "Analysis status unknown."
            };

            // ✅ Good - HTTP status codes that match the processing state
            var httpStatusCode = analysis.Status switch
            {
                "waiting_for_parsing" or "processing" => 202, // Accepted - still processing
                "completed" => 200, // OK - completed successfully
                "failed" => 200, // OK but with error details in response
                _ => 200
            };

            _logger.LogInformation("Analysis status for user {UserId}: {Status}", userId, analysis.Status);

            return StatusCode(httpStatusCode, new ApiResponse<AnalysisStatusDto>
            {
                Success = analysis.Status != "failed",
                Message = "Analysis status retrieved successfully",
                Data = statusDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving analysis status for user {UserId}", userId);
            return StatusCode(500, new ApiResponse<AnalysisStatusDto>
            {
                Success = false,
                Message = "An error occurred while retrieving analysis status. Please try again.",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Handle different processing states with appropriate responses
    /// </summary>
    [HttpGet("results")]
    public async Task<ActionResult<ApiResponse<ResumeAnalysisResultDto>>> GetAnalysisResults()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        try
        {
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("Unauthorized access attempt to analysis results endpoint");
                return Unauthorized(new ApiResponse<ResumeAnalysisResultDto>
                {
                    Success = false,
                    Message = "Authentication required. Please log in."
                });
            }

            _logger.LogInformation("Getting analysis results for user {UserId}", userId);

            var analysis = await _resumeAnalysisService.GetLatestAnalysisAsync(userId);

            if (analysis == null)
            {
                return NotFound(new ApiResponse<ResumeAnalysisResultDto>
                {
                    Success = false,
                    Message = "No resume analysis found. Please upload a resume first."
                });
            }

            // ✅ Good - Early return for processing states with 202 Accepted
            if (analysis.Status == "waiting_for_parsing" || analysis.Status == "processing")
            {
                var statusMessage = analysis.Status == "waiting_for_parsing" 
                    ? "Your resume is being parsed. Analysis will begin automatically once parsing is complete."
                    : "Your resume is being analyzed for ATS compatibility. Please check back in a few moments.";

                _logger.LogInformation("Analysis still processing for user {UserId}, status: {Status}", userId, analysis.Status);

                return StatusCode(202, new ApiResponse<ResumeAnalysisResultDto>
                {
                    Success = true,
                    Message = statusMessage,
                    Data = null
                });
            }

            // ✅ Good - Handle failure states with detailed error information
            if (analysis.Status == "failed")
            {
                _logger.LogWarning("Analysis failed for user {UserId}: {Error}", userId, analysis.AnalysisError);
                return Ok(new ApiResponse<ResumeAnalysisResultDto>
                {
                    Success = false,
                    Message = "Resume analysis failed. Please try again or contact support if the issue persists.",
                    Data = null,
                    Errors = new List<string> { analysis.AnalysisError ?? "Analysis failed for unknown reason" }
                });
            }

            // ✅ Good - Success case with rich data
            var resultDto = ResumeAnalysisMapper.ToResultDto(analysis);

            _logger.LogInformation("Returning completed analysis results for user {UserId}, score: {Score}", 
                userId, analysis.AtsOverallScore);

            return Ok(new ApiResponse<ResumeAnalysisResultDto>
            {
                Success = true,
                Message = $"Analysis completed successfully! Your ATS score is {analysis.AtsOverallScore}/100.",
                Data = resultDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving analysis results for user {UserId}", userId);
            return StatusCode(500, new ApiResponse<ResumeAnalysisResultDto>
            {
                Success = false,
                Message = "An error occurred while retrieving analysis results. Please try again.",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}
```

#### Key Patterns for Status-Based Controllers

1. **Use appropriate HTTP status codes**:
   - `200 OK`: Completed successfully
   - `202 Accepted`: Processing in progress
   - `404 Not Found`: Resource doesn't exist
   - `401 Unauthorized`: Authentication required
   - `500 Internal Server Error`: Unexpected errors

2. **Provide meaningful status messages**: Tailor messages to the current state and user context

3. **Handle all possible states**: Use switch expressions for clean state handling

4. **Log state transitions**: Include context like user ID and current status in logs

5. **Early returns for processing states**: Avoid deep nesting by returning early for non-final states

### Service Standards

#### Basic Service Pattern

```csharp
// Interface
public interface IDataService
{
    Task<User?> GetUserAsync(string userId);
    Task<User> CreateUserAsync(User user);
    Task<User> UpdateUserAsync(User user);
    Task<bool> DeleteUserAsync(string userId);
}

// Implementation
public class DatabaseDataService : IDataService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DatabaseDataService> _logger;

    public DatabaseDataService(ApplicationDbContext context, ILogger<DatabaseDataService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<User?> GetUserAsync(string userId)
    {
        try
        {
            return await _context.Users.FindAsync(userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user {UserId}", userId);
            throw;
        }
    }
}
```

#### Advanced Service Pattern with Complex Business Logic

```csharp
/// <summary>
/// Service interface for resume ATS analysis operations
/// </summary>
public interface IResumeAnalysisService
{
    /// <summary>
    /// Analyzes a resume for ATS compatibility using parsed content
    /// </summary>
    /// <param name="userId">The user ID who owns the resume</param>
    /// <param name="resumeContentId">The ID of the parsed resume content</param>
    /// <returns>The completed analysis result</returns>
    Task<ResumeAnalysis> AnalyzeResumeAsync(string userId, int resumeContentId);

    /// <summary>
    /// Gets the latest analysis for a user
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <returns>The latest analysis or null if not found</returns>
    Task<ResumeAnalysis?> GetLatestAnalysisAsync(string userId);

    /// <summary>
    /// Retries analysis for a user's latest resume
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <returns>True if retry was initiated, false if no analysis found</returns>
    Task<bool> RetryAnalysisAsync(string userId);
}

/// <summary>
/// Service for resume ATS analysis operations
/// </summary>
public class ResumeAnalysisService : IResumeAnalysisService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ResumeAnalysisService> _logger;
    private readonly IBedrockAgentService _bedrockService;
    private readonly IEmailService _emailService;

    public ResumeAnalysisService(
        ApplicationDbContext context,
        ILogger<ResumeAnalysisService> logger,
        IBedrockAgentService bedrockService,
        IEmailService emailService)
    {
        _context = context;
        _logger = logger;
        _bedrockService = bedrockService;
        _emailService = emailService;
    }

    /// <summary>
    /// Complex business operation with comprehensive error handling and logging
    /// </summary>
    public async Task<ResumeAnalysis> AnalyzeResumeAsync(string userId, int resumeContentId)
    {
        var startTime = DateTime.UtcNow;
        _logger.LogInformation("Starting ATS analysis for user {UserId}, resumeContentId {ResumeContentId}", 
            userId, resumeContentId);

        try
        {
            // ✅ Good - Validate dependencies and preconditions
            var resumeContent = await _context.ResumeContents
                .FirstOrDefaultAsync(rc => rc.Id == resumeContentId && rc.UserId == userId);

            if (resumeContent == null)
            {
                throw new InvalidOperationException($"Resume content with ID {resumeContentId} not found for user {userId}");
            }

            if (resumeContent.ParsingStatus != "completed")
            {
                throw new InvalidOperationException($"Resume parsing is not complete. Current status: {resumeContent.ParsingStatus}");
            }

            // ✅ Good - Deserialize and validate JSON content
            StructuredResumeContent? structuredContent;
            try
            {
                structuredContent = JsonSerializer.Deserialize<StructuredResumeContent>(resumeContent.ParsedContent);
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Failed to deserialize parsed content for resumeContentId {ResumeContentId}", resumeContentId);
                throw new InvalidOperationException("Invalid parsed content format", ex);
            }

            if (structuredContent == null)
            {
                throw new InvalidOperationException("Parsed content is null after deserialization");
            }

            // ✅ Good - Call external service with timing and error handling
            var bedrockStartTime = DateTime.UtcNow;
            var analysisResult = await CallBedrockForAnalysisAsync(BuildAtsAnalysisPrompt(structuredContent));
            var bedrockDuration = (DateTime.UtcNow - bedrockStartTime).TotalSeconds;
            
            _logger.LogInformation("Bedrock analysis completed in {Duration:F2}s for user {UserId}", 
                bedrockDuration, userId);

            // ✅ Good - Process results and create domain model
            var overallScore = CalculateOverallScore(analysisResult);

            var analysis = new ResumeAnalysis
            {
                UserId = userId,
                ResumeContentId = resumeContentId,
                Status = "completed",
                AtsOverallScore = overallScore,
                AtsFormattingScore = analysisResult.FormattingScore,
                // ... other properties
                ProcessedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // ✅ Good - Persist to database
            _context.ResumeAnalyses.Add(analysis);
            await _context.SaveChangesAsync();

            var totalDuration = (DateTime.UtcNow - startTime).TotalSeconds;
            _logger.LogInformation("ATS analysis completed in {Duration:F2}s for user {UserId}, overall score: {Score}", 
                totalDuration, userId, overallScore);

            // ✅ Good - Fire-and-forget side effects with error isolation
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user != null)
                {
                    await _emailService.SendAnalysisCompleteEmailAsync(userId, user.Email, user.Name, overallScore, analysisResult.Recommendations);
                    _logger.LogInformation("Analysis completion email sent to user {UserId}", userId);
                }
            }
            catch (Exception emailEx)
            {
                _logger.LogWarning(emailEx, "Failed to send analysis completion email to user {UserId}", userId);
                // Don't fail the analysis if email fails
            }

            return analysis;
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("parsing is not complete"))
        {
            var duration = (DateTime.UtcNow - startTime).TotalSeconds;
            _logger.LogWarning(ex, "Parsing not complete for user {UserId}, resumeContentId {ResumeContentId} after {Duration:F2}s", 
                userId, resumeContentId, duration);

            await HandleAnalysisErrorAsync(userId, resumeContentId, "Resume parsing is not complete. Please wait for parsing to finish.");
            throw new InvalidOperationException("Resume parsing is not complete. Please wait for parsing to finish.", ex);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("timeout"))
        {
            var duration = (DateTime.UtcNow - startTime).TotalSeconds;
            _logger.LogError(ex, "Bedrock timeout during ATS analysis for user {UserId}, resumeContentId {ResumeContentId} after {Duration:F2}s", 
                userId, resumeContentId, duration);

            await HandleAnalysisErrorAsync(userId, resumeContentId, "Analysis took too long. Please try again.");
            throw new InvalidOperationException("Analysis took too long. Please try again.", ex);
        }
        catch (Exception ex)
        {
            var duration = (DateTime.UtcNow - startTime).TotalSeconds;
            _logger.LogError(ex, "Unexpected error during ATS analysis for user {UserId}, resumeContentId {ResumeContentId} after {Duration:F2}s: {ErrorType}", 
                userId, resumeContentId, duration, ex.GetType().Name);

            await HandleAnalysisErrorAsync(userId, resumeContentId, "An unexpected error occurred. Please try again.");
            throw new InvalidOperationException("An unexpected error occurred during analysis. Please try again.", ex);
        }
    }

    /// <summary>
    /// Simple query operation with error handling
    /// </summary>
    public async Task<ResumeAnalysis?> GetLatestAnalysisAsync(string userId)
    {
        try
        {
            return await _context.ResumeAnalyses
                .Where(ra => ra.UserId == userId)
                .OrderByDescending(ra => ra.CreatedAt)
                .FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving latest analysis for user {UserId}", userId);
            throw;
        }
    }

    /// <summary>
    /// Business logic operation with state management
    /// </summary>
    public async Task<bool> RetryAnalysisAsync(string userId)
    {
        try
        {
            _logger.LogInformation("Retrying analysis for user {UserId}", userId);

            var analysis = await GetLatestAnalysisAsync(userId);
            if (analysis == null)
            {
                _logger.LogWarning("No analysis found for user {UserId} to retry", userId);
                return false;
            }

            // ✅ Good - Check dependencies before state changes
            ResumeContent? resumeContent = null;
            if (analysis.ResumeContentId.HasValue)
            {
                resumeContent = await _context.ResumeContents
                    .FirstOrDefaultAsync(rc => rc.Id == analysis.ResumeContentId.Value);
            }

            // ✅ Good - State management based on business rules
            if (resumeContent?.ParsingStatus == "completed")
            {
                analysis.Status = "processing";
                _logger.LogInformation("Reset analysis status to 'processing' for user {UserId}", userId);
            }
            else
            {
                analysis.Status = "waiting_for_parsing";
                _logger.LogInformation("Reset analysis status to 'waiting_for_parsing' for user {UserId}", userId);
            }

            analysis.AnalysisError = null;
            analysis.UpdatedAt = DateTime.UtcNow;

            _context.ResumeAnalyses.Update(analysis);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Successfully reset analysis for retry for user {UserId}", userId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrying analysis for user {UserId}", userId);
            throw;
        }
    }

    /// <summary>
    /// Private helper method for error handling with database operations
    /// </summary>
    private async Task HandleAnalysisErrorAsync(string userId, int resumeContentId, string errorMessage)
    {
        try
        {
            var analysis = await _context.ResumeAnalyses
                .FirstOrDefaultAsync(ra => ra.UserId == userId && ra.ResumeContentId == resumeContentId);

            if (analysis == null)
            {
                analysis = await _context.ResumeAnalyses
                    .Where(ra => ra.UserId == userId)
                    .OrderByDescending(ra => ra.CreatedAt)
                    .FirstOrDefaultAsync();
            }

            if (analysis != null)
            {
                analysis.Status = "failed";
                analysis.AnalysisError = errorMessage;
                analysis.UpdatedAt = DateTime.UtcNow;

                _context.ResumeAnalyses.Update(analysis);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Updated analysis status to 'failed' for user {UserId}, analysisId {AnalysisId}, error: {Error}", 
                    userId, analysis.Id, errorMessage);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating analysis status to failed for user {UserId}, resumeContentId {ResumeContentId}", 
                userId, resumeContentId);
        }
    }
}
```

#### Service Design Best Practices

1. **Comprehensive XML Documentation**: Document all public methods with parameters, return values, and exceptions
2. **Dependency Injection**: Use constructor injection for all dependencies
3. **Structured Logging**: Include relevant context in all log messages (user IDs, operation details, timing)
4. **Error Isolation**: Don't let side effects (like email sending) fail the main operation
5. **State Validation**: Always validate preconditions before performing operations
6. **Performance Monitoring**: Log operation timing for performance analysis
7. **Graceful Degradation**: Handle partial failures appropriately
8. **Exception Translation**: Convert technical exceptions to business-friendly messages

### Model Standards

```csharp
public class User
{
    // Primary key
    public string Id { get; set; } = string.Empty;
    
    // Required fields
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    
    // Optional fields
    public string? Phone { get; set; }
    public string? Location { get; set; }
    
    // Collections
    public List<string> Skills { get; set; } = new();
    
    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual EmailPreference? EmailPreference { get; set; }
    
    // Methods
    public bool HasAccess()
    {
        var isTrialValid = IsTrialActive && DateTime.UtcNow < TrialEndDate;
        return isTrialValid || HasActiveSubscription;
    }
}
```

### Async/Await Best Practices

```csharp
// ✅ Good - Async all the way
public async Task<User> GetUserAsync(string userId)
{
    return await _context.Users.FindAsync(userId);
}

// ❌ Bad - Blocking async code
public User GetUser(string userId)
{
    return _context.Users.FindAsync(userId).Result;  // Don't do this!
}

// ✅ Good - ConfigureAwait(false) in libraries
public async Task<User> GetUserAsync(string userId)
{
    return await _context.Users.FindAsync(userId).ConfigureAwait(false);
}

// ✅ Good - Async controller actions with proper error handling
[HttpPost("retry")]
public async Task<ActionResult<ApiResponse<string>>> RetryAnalysis()
{
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    try
    {
        if (string.IsNullOrEmpty(userId))
        {
            _logger.LogWarning("Unauthorized access attempt to analysis retry endpoint");
            return Unauthorized(new ApiResponse<string>
            {
                Success = false,
                Message = "Authentication required. Please log in."
            });
        }

        _logger.LogInformation("Retrying analysis for user {UserId}", userId);

        // ✅ Good - Await service calls properly
        var retrySuccessful = await _resumeAnalysisService.RetryAnalysisAsync(userId);

        if (!retrySuccessful)
        {
            _logger.LogWarning("No analysis found to retry for user {UserId}", userId);
            return NotFound(new ApiResponse<string>
            {
                Success = false,
                Message = "No resume analysis found to retry. Please upload a resume first."
            });
        }

        _logger.LogInformation("Analysis retry initiated successfully for user {UserId}", userId);

        return Ok(new ApiResponse<string>
        {
            Success = true,
            Message = "Analysis retry initiated successfully. Your resume will be re-analyzed shortly.",
            Data = "Retry initiated"
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error retrying analysis for user {UserId}", userId);
        return StatusCode(500, new ApiResponse<string>
        {
            Success = false,
            Message = "An error occurred while retrying the analysis. Please try again.",
            Errors = new List<string> { ex.Message }
        });
    }
}

// ✅ Good - Multiple async operations with proper exception handling
public async Task<ActionResult<ApiResponse<AnalysisStatusDto>>> GetAnalysisStatus()
{
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    try
    {
        // ✅ Good - Validate inputs before async operations
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new ApiResponse<AnalysisStatusDto>
            {
                Success = false,
                Message = "Authentication required. Please log in."
            });
        }

        // ✅ Good - Single await for service call
        var analysis = await _resumeAnalysisService.GetLatestAnalysisAsync(userId);
        
        // ✅ Good - Process results synchronously after async call
        if (analysis == null)
        {
            return NotFound(new ApiResponse<AnalysisStatusDto>
            {
                Success = false,
                Message = "No resume analysis found. Please upload a resume first."
            });
        }

        // ✅ Good - Build response object synchronously
        var statusDto = new AnalysisStatusDto
        {
            Status = analysis.Status,
            OverallScore = analysis.AtsOverallScore,
            CompletedAt = analysis.Status == "completed" ? analysis.ProcessedAt : null,
            ErrorMessage = analysis.AnalysisError
        };

        return Ok(new ApiResponse<AnalysisStatusDto>
        {
            Success = analysis.Status != "failed",
            Message = "Analysis status retrieved successfully",
            Data = statusDto
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error retrieving analysis status for user {UserId}", userId);
        return StatusCode(500, new ApiResponse<AnalysisStatusDto>
        {
            Success = false,
            Message = "An error occurred while retrieving analysis status. Please try again.",
            Errors = new List<string> { ex.Message }
        });
    }
}
```

### Error Handling

#### Basic Error Handling Pattern

```csharp
// ✅ Good - Specific exceptions, logging, user-friendly messages
try
{
    var user = await _dataService.GetUserAsync(userId);
    return Ok(user);
}
catch (NotFoundException ex)
{
    _logger.LogWarning(ex, "User {UserId} not found", userId);
    return NotFound(new { message = "User not found" });
}
catch (Exception ex)
{
    _logger.LogError(ex, "Error retrieving user {UserId}", userId);
    return StatusCode(500, new { message = "An error occurred" });
}

// ❌ Bad - Swallowing exceptions
try
{
    var user = await _dataService.GetUserAsync(userId);
}
catch
{
    // Don't do this!
}
```

#### Advanced Error Handling for Analysis Endpoints

```csharp
// ✅ Good - Comprehensive error handling with context-aware responses
[HttpGet("results")]
public async Task<ActionResult<ApiResponse<ResumeAnalysisResultDto>>> GetAnalysisResults()
{
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    try
    {
        // ✅ Good - Early validation with specific error messages
        if (string.IsNullOrEmpty(userId))
        {
            _logger.LogWarning("Unauthorized access attempt to analysis results endpoint");
            return Unauthorized(new ApiResponse<ResumeAnalysisResultDto>
            {
                Success = false,
                Message = "Authentication required. Please log in."
            });
        }

        _logger.LogInformation("Getting analysis results for user {UserId}", userId);

        var analysis = await _resumeAnalysisService.GetLatestAnalysisAsync(userId);

        // ✅ Good - Handle business logic "errors" as valid responses
        if (analysis == null)
        {
            _logger.LogInformation("No analysis found for user {UserId}", userId);
            return NotFound(new ApiResponse<ResumeAnalysisResultDto>
            {
                Success = false,
                Message = "No resume analysis found. Please upload a resume first."
            });
        }

        // ✅ Good - Handle different states with appropriate responses
        if (analysis.Status == "failed")
        {
            _logger.LogWarning("Analysis failed for user {UserId}: {Error}", userId, analysis.AnalysisError);
            return Ok(new ApiResponse<ResumeAnalysisResultDto>
            {
                Success = false,
                Message = "Resume analysis failed. Please try again or contact support if the issue persists.",
                Data = null,
                Errors = new List<string> { analysis.AnalysisError ?? "Analysis failed for unknown reason" }
            });
        }

        // Success path...
        var resultDto = ResumeAnalysisMapper.ToResultDto(analysis);
        return Ok(new ApiResponse<ResumeAnalysisResultDto>
        {
            Success = true,
            Message = $"Analysis completed successfully! Your ATS score is {analysis.AtsOverallScore}/100.",
            Data = resultDto
        });
    }
    catch (Exception ex)
    {
        // ✅ Good - Log with full context and return user-friendly message
        _logger.LogError(ex, "Error retrieving analysis results for user {UserId}", userId);
        return StatusCode(500, new ApiResponse<ResumeAnalysisResultDto>
        {
            Success = false,
            Message = "An error occurred while retrieving analysis results. Please try again.",
            Errors = new List<string> { ex.Message }
        });
    }
}

// ✅ Good - Consistent error handling pattern across endpoints
[HttpPost("retry")]
public async Task<ActionResult<ApiResponse<string>>> RetryAnalysis()
{
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    try
    {
        if (string.IsNullOrEmpty(userId))
        {
            _logger.LogWarning("Unauthorized access attempt to analysis retry endpoint");
            return Unauthorized(new ApiResponse<string>
            {
                Success = false,
                Message = "Authentication required. Please log in."
            });
        }

        _logger.LogInformation("Retrying analysis for user {UserId}", userId);

        var retrySuccessful = await _resumeAnalysisService.RetryAnalysisAsync(userId);

        if (!retrySuccessful)
        {
            _logger.LogWarning("No analysis found to retry for user {UserId}", userId);
            return NotFound(new ApiResponse<string>
            {
                Success = false,
                Message = "No resume analysis found to retry. Please upload a resume first."
            });
        }

        _logger.LogInformation("Analysis retry initiated successfully for user {UserId}", userId);

        return Ok(new ApiResponse<string>
        {
            Success = true,
            Message = "Analysis retry initiated successfully. Your resume will be re-analyzed shortly.",
            Data = "Retry initiated"
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error retrying analysis for user {UserId}", userId);
        return StatusCode(500, new ApiResponse<string>
        {
            Success = false,
            Message = "An error occurred while retrying the analysis. Please try again.",
            Errors = new List<string> { ex.Message }
        });
    }
}
```

#### Error Handling Best Practices

1. **Always log errors with context**: Include user ID, operation details, and relevant parameters
2. **Use appropriate log levels**:
   - `LogWarning`: Expected business logic issues (not found, unauthorized)
   - `LogError`: Unexpected exceptions that need investigation
   - `LogInformation`: Successful operations and state changes
3. **Provide user-friendly messages**: Never expose internal error details to users
4. **Use consistent response structure**: Always use the same `ApiResponse<T>` format
5. **Handle business logic "errors" as valid responses**: Not all error conditions are exceptions
6. **Include error arrays for detailed feedback**: Use the `Errors` property for multiple validation issues

### Dependency Injection

#### Service Registration in Program.cs

```csharp
// ✅ Good - Register services with appropriate lifetimes
builder.Services.AddScoped<IDataService, DatabaseDataService>();
builder.Services.AddScoped<IS3Service, S3Service>();
builder.Services.AddScoped<IResumeAnalysisService, ResumeAnalysisService>();
builder.Services.AddScoped<IBedrockAgentService, BedrockAgentService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// ✅ Good - Background services
builder.Services.AddHostedService<ResumeParsingBackgroundService>();

// ✅ Good - Singletons for stateless services
builder.Services.AddSingleton<IConfiguration>(builder.Configuration);
```

#### Constructor Injection Patterns

```csharp
// ✅ Good - Basic constructor injection
public class UsersController : ControllerBase
{
    private readonly IDataService _dataService;
    
    public UsersController(IDataService dataService)
    {
        _dataService = dataService;
    }
}

// ✅ Good - Multiple dependencies with proper organization
public class ResumeAnalysisService : IResumeAnalysisService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ResumeAnalysisService> _logger;
    private readonly IBedrockAgentService _bedrockService;
    private readonly IEmailService _emailService;

    public ResumeAnalysisService(
        ApplicationDbContext context,
        ILogger<ResumeAnalysisService> logger,
        IBedrockAgentService bedrockService,
        IEmailService emailService)
    {
        _context = context;
        _logger = logger;
        _bedrockService = bedrockService;
        _emailService = emailService;
    }
}

// ✅ Good - Controller with multiple service dependencies
public class ResumeAnalysisController : ControllerBase
{
    private readonly IResumeAnalysisService _resumeAnalysisService;
    private readonly ILogger<ResumeAnalysisController> _logger;

    public ResumeAnalysisController(
        IResumeAnalysisService resumeAnalysisService,
        ILogger<ResumeAnalysisController> logger)
    {
        _resumeAnalysisService = resumeAnalysisService;
        _logger = logger;
    }
}

// ❌ Bad - Service locator pattern
public class UsersController : ControllerBase
{
    public IActionResult GetUser(string id)
    {
        var dataService = HttpContext.RequestServices.GetService<IDataService>();
        // Don't do this!
    }
}
```

#### Service Lifetime Guidelines

1. **Scoped**: Most application services (per HTTP request)
   - Controllers, business services, data services
   - `IResumeAnalysisService`, `IDataService`, `IEmailService`

2. **Singleton**: Stateless services and configuration
   - `IConfiguration`, caching services, stateless utilities
   - Services that are expensive to create

3. **Transient**: Lightweight, stateless services
   - Simple utilities, mappers, validators
   - Services that maintain no state between calls

4. **Hosted Services**: Background processing
   - `ResumeParsingBackgroundService`
   - Long-running background tasks

### Logging

#### Basic Logging Patterns

```csharp
// ✅ Good - Structured logging with context
_logger.LogInformation("User {UserId} logged in successfully", userId);
_logger.LogWarning("Failed login attempt for email {Email}", email);
_logger.LogError(ex, "Error processing resume {ResumeId} for user {UserId}", resumeId, userId);

// ❌ Bad - String interpolation in logs
_logger.LogInformation($"User {userId} logged in");  // Don't do this!

// Log levels
_logger.LogTrace("Detailed trace information");      // Very detailed
_logger.LogDebug("Debug information");               // Development only
_logger.LogInformation("General information");       // Normal flow
_logger.LogWarning("Warning - something unexpected"); // Recoverable
_logger.LogError(ex, "Error occurred");              // Error with exception
_logger.LogCritical(ex, "Critical failure");         // System failure
```

#### Advanced Logging for Analysis Services

```csharp
// ✅ Good - Operation start with timing context
public async Task<ResumeAnalysis> AnalyzeResumeAsync(string userId, int resumeContentId)
{
    var startTime = DateTime.UtcNow;
    _logger.LogInformation("Starting ATS analysis for user {UserId}, resumeContentId {ResumeContentId}", 
        userId, resumeContentId);

    try
    {
        // ✅ Good - Log external service calls with timing
        var bedrockStartTime = DateTime.UtcNow;
        var analysisResult = await CallBedrockForAnalysisAsync(prompt);
        var bedrockDuration = (DateTime.UtcNow - bedrockStartTime).TotalSeconds;
        
        _logger.LogInformation("Bedrock analysis completed in {Duration:F2}s for user {UserId}", 
            bedrockDuration, userId);

        // ✅ Good - Log successful completion with key metrics
        var totalDuration = (DateTime.UtcNow - startTime).TotalSeconds;
        _logger.LogInformation("ATS analysis completed in {Duration:F2}s for user {UserId}, overall score: {Score}", 
            totalDuration, userId, overallScore);

        return analysis;
    }
    catch (InvalidOperationException ex) when (ex.Message.Contains("parsing is not complete"))
    {
        var duration = (DateTime.UtcNow - startTime).TotalSeconds;
        _logger.LogWarning(ex, "Parsing not complete for user {UserId}, resumeContentId {ResumeContentId} after {Duration:F2}s", 
            userId, resumeContentId, duration);
        throw;
    }
    catch (Exception ex)
    {
        var duration = (DateTime.UtcNow - startTime).TotalSeconds;
        _logger.LogError(ex, "Unexpected error during ATS analysis for user {UserId}, resumeContentId {ResumeContentId} after {Duration:F2}s: {ErrorType}", 
            userId, resumeContentId, duration, ex.GetType().Name);
        throw;
    }
}

// ✅ Good - Controller logging with HTTP context
[HttpGet("status")]
public async Task<ActionResult<ApiResponse<AnalysisStatusDto>>> GetAnalysisStatus()
{
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    try
    {
        if (string.IsNullOrEmpty(userId))
        {
            _logger.LogWarning("Unauthorized access attempt to analysis status endpoint");
            return Unauthorized(/* ... */);
        }

        _logger.LogInformation("Getting analysis status for user {UserId}", userId);

        var analysis = await _resumeAnalysisService.GetLatestAnalysisAsync(userId);

        if (analysis == null)
        {
            _logger.LogInformation("No analysis found for user {UserId}", userId);
            return NotFound(/* ... */);
        }

        _logger.LogInformation("Analysis status for user {UserId}: {Status}", userId, analysis.Status);
        return Ok(/* ... */);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error retrieving analysis status for user {UserId}", userId);
        return StatusCode(500, /* ... */);
    }
}

// ✅ Good - State change logging
public async Task<bool> RetryAnalysisAsync(string userId)
{
    try
    {
        _logger.LogInformation("Retrying analysis for user {UserId}", userId);

        var analysis = await GetLatestAnalysisAsync(userId);
        if (analysis == null)
        {
            _logger.LogWarning("No analysis found for user {UserId} to retry", userId);
            return false;
        }

        if (resumeContent?.ParsingStatus == "completed")
        {
            analysis.Status = "processing";
            _logger.LogInformation("Reset analysis status to 'processing' for user {UserId}", userId);
        }
        else
        {
            analysis.Status = "waiting_for_parsing";
            _logger.LogInformation("Reset analysis status to 'waiting_for_parsing' for user {UserId}", userId);
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Successfully reset analysis for retry for user {UserId}", userId);
        return true;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error retrying analysis for user {UserId}", userId);
        throw;
    }
}

// ✅ Good - Side effect logging with error isolation
try
{
    var user = await _context.Users.FindAsync(userId);
    if (user != null)
    {
        await _emailService.SendAnalysisCompleteEmailAsync(userId, user.Email, user.Name, overallScore, recommendations);
        _logger.LogInformation("Analysis completion email sent to user {UserId}", userId);
    }
}
catch (Exception emailEx)
{
    _logger.LogWarning(emailEx, "Failed to send analysis completion email to user {UserId}", userId);
    // Don't fail the analysis if email fails
}
```

#### Logging Best Practices for Analysis Services

1. **Operation Timing**: Always log start time and duration for long-running operations
2. **State Transitions**: Log all status changes with context
3. **External Service Calls**: Log timing and results of external API calls
4. **Error Context**: Include operation duration and error type in error logs
5. **User Context**: Always include user ID in logs for traceability
6. **Performance Metrics**: Log key metrics like scores, processing times
7. **Side Effect Isolation**: Log side effects separately and don't let them fail main operations
8. **Structured Parameters**: Use structured logging parameters, not string interpolation

---

## TypeScript / React Frontend Standards

### Naming Conventions

**PascalCase**:
- Components: `UserProfile`, `ResumeUpload`
- Interfaces/Types: `User`, `ApiResponse<T>`

**camelCase**:
- Variables: `userId`, `isLoading`
- Functions: `fetchUser`, `handleSubmit`
- Props: `onSubmit`, `userName`

**UPPER_SNAKE_CASE**:
- Constants: `API_BASE_URL`, `MAX_FILE_SIZE`

### File Organization

```
hirethemnow.client/src/
├── components/        # Reusable components
├── pages/            # Page components
├── utils/            # Utility functions
├── types/            # TypeScript types
├── hooks/            # Custom React hooks
├── services/         # API services
└── App.tsx           # Main app component
```

### Component Standards

```typescript
// ✅ Good - Functional component with TypeScript
import React, { useState, useEffect } from 'react';

interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      setUser(data.data);
    } catch (err) {
      setError('Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
};
```

### Custom Hooks

```typescript
// ✅ Good - Custom hook for API calls
export const useUser = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();
        setUser(data.data);
      } catch (err) {
        setError('Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { user, loading, error };
};

// Usage
const { user, loading, error } = useUser(userId);
```

### API Service Layer

```typescript
// ✅ Good - Centralized API service
export class ApiService {
  private static baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5219';

  static async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  static async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private static getToken(): string {
    return localStorage.getItem('token') || '';
  }
}

// Usage
const user = await ApiService.get<User>('/api/users/profile');
```

### TypeScript Types

```typescript
// ✅ Good - Define types for all data structures
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'candidate' | 'employer';
  picture?: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

// ✅ Good - Use generics for reusable types
export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};
```

---

## Database Standards

### Entity Framework Conventions

```csharp
// ✅ Good - Explicit configuration
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<User>(entity =>
    {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Email).IsRequired();
        entity.HasIndex(e => e.Email).IsUnique();
    });
}

// ✅ Good - Use migrations for schema changes
dotnet ef migrations add AddUserPhoneNumber
dotnet ef database update
```

### Query Best Practices

```csharp
// ✅ Good - Use async, Include for eager loading
var user = await _context.Users
    .Include(u => u.EmailPreference)
    .FirstOrDefaultAsync(u => u.Id == userId);

// ❌ Bad - N+1 query problem
var users = await _context.Users.ToListAsync();
foreach (var user in users)
{
    var prefs = await _context.EmailPreferences
        .FirstOrDefaultAsync(e => e.UserId == user.Id);  // Don't do this!
}

// ✅ Good - Projection for performance
var userDtos = await _context.Users
    .Select(u => new UserDto
    {
        Id = u.Id,
        Name = u.Name,
        Email = u.Email
    })
    .ToListAsync();
```

---

## Testing Standards

### Unit Test Structure

```csharp
[TestClass]
public class UserServiceTests
{
    private Mock<ApplicationDbContext> _mockContext;
    private UserService _userService;

    [TestInitialize]
    public void Setup()
    {
        _mockContext = new Mock<ApplicationDbContext>();
        _userService = new UserService(_mockContext.Object);
    }

    [TestMethod]
    public async Task GetUserAsync_ValidId_ReturnsUser()
    {
        // Arrange
        var userId = "test-user-id";
        var expectedUser = new User { Id = userId, Name = "Test User" };
        _mockContext.Setup(c => c.Users.FindAsync(userId))
            .ReturnsAsync(expectedUser);

        // Act
        var result = await _userService.GetUserAsync(userId);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(expectedUser.Id, result.Id);
        Assert.AreEqual(expectedUser.Name, result.Name);
    }

    [TestMethod]
    public async Task GetUserAsync_InvalidId_ReturnsNull()
    {
        // Arrange
        var userId = "invalid-id";
        _mockContext.Setup(c => c.Users.FindAsync(userId))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _userService.GetUserAsync(userId);

        // Assert
        Assert.IsNull(result);
    }
}
```

---

## Git Commit Standards

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(auth): add Google OAuth authentication

Implemented Google OAuth login flow with JWT token generation.
Users can now sign in using their Google account.

Closes #123

---

fix(resume): handle corrupted PDF files gracefully

Added error handling for corrupted or encrypted PDF files.
Users now see a clear error message instead of a generic failure.

Fixes #456

---

docs(api): update API endpoint documentation

Added missing endpoints and updated response examples.
```

---

## Security Best Practices

### Input Validation

```csharp
// ✅ Good - Validate all inputs
[HttpPost]
public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
{
    if (string.IsNullOrWhiteSpace(request.Email))
    {
        return BadRequest("Email is required");
    }

    if (!IsValidEmail(request.Email))
    {
        return BadRequest("Invalid email format");
    }

    // Process request...
}
```

### SQL Injection Prevention

```csharp
// ✅ Good - Use parameterized queries (EF Core does this automatically)
var user = await _context.Users
    .FirstOrDefaultAsync(u => u.Email == email);

// ❌ Bad - Raw SQL with string concatenation
var query = $"SELECT * FROM Users WHERE Email = '{email}'";  // Don't do this!
```

### XSS Prevention

```typescript
// ✅ Good - React escapes by default
<div>{user.name}</div>

// ❌ Bad - dangerouslySetInnerHTML without sanitization
<div dangerouslySetInnerHTML={{ __html: userInput }} />  // Don't do this!
```

### Authentication

```csharp
// ✅ Good - Use [Authorize] attribute
[Authorize]
[HttpGet("profile")]
public async Task<IActionResult> GetProfile()
{
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    // Process request...
}
```

---

## Performance Best Practices

### Database

- Use indexes on frequently queried columns
- Use `.AsNoTracking()` for read-only queries
- Avoid N+1 queries with `.Include()`
- Use pagination for large result sets
- Cache frequently accessed data

### API

- Use async/await for I/O operations
- Implement response compression
- Use CDN for static assets
- Minimize payload size
- Implement caching headers

### Frontend

- Lazy load components
- Optimize images
- Use React.memo for expensive components
- Debounce user input
- Minimize bundle size

---

## Code Review Checklist

- [ ] Code follows naming conventions
- [ ] All methods have XML documentation
- [ ] Error handling is implemented
- [ ] Logging is added for important operations
- [ ] Unit tests are written
- [ ] No hardcoded values (use configuration)
- [ ] Security best practices followed
- [ ] Performance considerations addressed
- [ ] Code is DRY (no duplication)
- [ ] Git commit message follows standards

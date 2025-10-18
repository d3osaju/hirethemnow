using Microsoft.AspNetCore.Mvc;
using HireThemNoW.Server.Services;
using HireThemNoW.Server.Models;
using System.Text.Json;

namespace HireThemNoW.Server.Controllers;

/// <summary>
/// Controller for handling job opportunity webhook requests
/// Accepts job posting data from external sources and stores them in the system
/// 
/// Security: All requests must include a valid secret token that matches the WEBHOOK_SECRET environment variable.
/// This prevents unauthorized access and ensures only legitimate webhook sources can submit job data.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class JobWebhookController : ControllerBase
{
    private readonly IJobWebhookService _jobWebhookService;
    private readonly ILogger<JobWebhookController> _logger;
    private readonly IConfiguration _configuration;

    public JobWebhookController(
        IJobWebhookService jobWebhookService,
        ILogger<JobWebhookController> logger,
        IConfiguration configuration)
    {
        _jobWebhookService = jobWebhookService ?? throw new ArgumentNullException(nameof(jobWebhookService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
    }

    /// <summary>
    /// Creates a new job opportunity from webhook data
    /// Accepts POST requests with job opportunity data and stores them in the database
    /// Requires valid secret token for authentication
    /// </summary>
    /// <param name="jobDto">Job opportunity data from external source including secret token</param>
    /// <returns>Created job opportunity with success status</returns>
    /// <response code="200">Job opportunity created successfully</response>
    /// <response code="400">Invalid request data or validation errors</response>
    /// <response code="401">Invalid or missing authentication token</response>
    /// <response code="500">Internal server error during processing</response>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<JobOpportunity>>> CreateJobOpportunity(
        [FromBody] JobOpportunityDto jobDto)
    {
        try
        {
            _logger.LogInformation("Received job webhook request for company: {Company}, title: {JobTitle}", 
                jobDto?.Company ?? "Unknown", jobDto?.JobTitle ?? "Unknown");

            // Validate request body
            if (jobDto == null)
            {
                _logger.LogWarning("Job webhook request received with null body");
                return BadRequest(new ApiResponse<JobOpportunity>
                {
                    Success = false,
                    Message = "Request body is required",
                    Errors = new List<string> { "Job opportunity data cannot be null" }
                });
            }

            // Validate secret token for authentication
            var expectedSecret = _configuration["WEBHOOK_SECRET"];
            if (string.IsNullOrEmpty(expectedSecret))
            {
                _logger.LogError("WEBHOOK_SECRET configuration is missing");
                return StatusCode(500, new ApiResponse<JobOpportunity>
                {
                    Success = false,
                    Message = "Server configuration error",
                    Errors = new List<string> { "Webhook authentication not configured" }
                });
            }

            if (string.IsNullOrEmpty(jobDto.SecretToken) || jobDto.SecretToken != expectedSecret)
            {
                _logger.LogWarning("Job webhook request received with invalid or missing secret token from company: {Company}", 
                    jobDto.Company ?? "Unknown");
                return Unauthorized(new ApiResponse<JobOpportunity>
                {
                    Success = false,
                    Message = "Invalid or missing authentication token",
                    Errors = new List<string> { "Authentication failed" }
                });
            }

            // Validate model state (data annotations)
            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .SelectMany(x => x.Value?.Errors ?? new Microsoft.AspNetCore.Mvc.ModelBinding.ModelErrorCollection())
                    .Select(x => x.ErrorMessage)
                    .ToList();

                _logger.LogWarning("Job webhook validation failed: {Errors}", string.Join("; ", errors));
                
                return BadRequest(new ApiResponse<JobOpportunity>
                {
                    Success = false,
                    Message = "Validation failed",
                    Errors = errors
                });
            }

            // Create job opportunity through service
            var createdJob = await _jobWebhookService.CreateJobOpportunityAsync(jobDto);

            _logger.LogInformation("Successfully created job opportunity with ID: {Id} for company: {Company}", 
                createdJob.Id, createdJob.Company);

            return Ok(new ApiResponse<JobOpportunity>
            {
                Success = true,
                Message = "Job opportunity created successfully",
                Data = createdJob
            });
        }
        catch (ArgumentNullException ex)
        {
            _logger.LogError(ex, "Null argument error in job webhook: {Message}", ex.Message);
            return BadRequest(new ApiResponse<JobOpportunity>
            {
                Success = false,
                Message = "Invalid request data",
                Errors = new List<string> { ex.Message }
            });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error in job webhook: {Message}", ex.Message);
            return BadRequest(new ApiResponse<JobOpportunity>
            {
                Success = false,
                Message = "Validation failed",
                Errors = new List<string> { ex.Message }
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Database operation failed in job webhook: {Message}", ex.Message);
            return StatusCode(500, new ApiResponse<JobOpportunity>
            {
                Success = false,
                Message = "An error occurred while processing the job opportunity",
                Errors = new List<string> { "Database operation failed" }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in job webhook: {Message}", ex.Message);
            return StatusCode(500, new ApiResponse<JobOpportunity>
            {
                Success = false,
                Message = "An unexpected error occurred while processing the request",
                Errors = new List<string> { "Internal server error" }
            });
        }
    }

    /// <summary>
    /// Creates multiple job opportunities from webhook data in bulk
    /// Accepts POST requests with an array of job opportunity data and stores them in the database
    /// Requires valid secret token for authentication in each job object
    /// </summary>
    /// <param name="jobDtos">Array of job opportunity data from external source including secret tokens</param>
    /// <returns>Bulk creation result with success and failure details</returns>
    /// <response code="200">Bulk operation completed (may include partial failures)</response>
    /// <response code="400">Invalid request data or validation errors</response>
    /// <response code="401">Invalid or missing authentication token</response>
    /// <response code="500">Internal server error during processing</response>
    [HttpPost("bulk")]
    public async Task<ActionResult<ApiResponse<BulkJobCreationResult>>> CreateJobOpportunitiesBulk(
        [FromBody] object requestBody)
    {
        try
        {
            // Handle both array and object wrapper formats
            List<JobOpportunityDto> jobDtos;
            
            if (requestBody is JsonElement jsonElement)
            {
                // Configure JSON options for camelCase property names
                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                };

                if (jsonElement.ValueKind == JsonValueKind.Array)
                {
                    // Direct array format
                    jobDtos = JsonSerializer.Deserialize<List<JobOpportunityDto>>(jsonElement.GetRawText(), jsonOptions) ?? new List<JobOpportunityDto>();
                }
                else if (jsonElement.ValueKind == JsonValueKind.Object)
                {
                    // Check for different wrapper formats
                    if (jsonElement.TryGetProperty("jobs", out var jobsProperty))
                    {
                        // n8n format with "jobs" property
                        jobDtos = JsonSerializer.Deserialize<List<JobOpportunityDto>>(jobsProperty.GetRawText(), jsonOptions) ?? new List<JobOpportunityDto>();
                    }
                    else if (jsonElement.TryGetProperty("jobDtos", out var jobDtosProperty))
                    {
                        // Alternative wrapper format
                        jobDtos = JsonSerializer.Deserialize<List<JobOpportunityDto>>(jobDtosProperty.GetRawText(), jsonOptions) ?? new List<JobOpportunityDto>();
                    }
                    else
                    {
                        jobDtos = new List<JobOpportunityDto>();
                    }
                }
                else
                {
                    jobDtos = new List<JobOpportunityDto>();
                }
            }
            else
            {
                // Try to deserialize as array directly
                var jsonOptions = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                };
                var jsonString = JsonSerializer.Serialize(requestBody);
                jobDtos = JsonSerializer.Deserialize<List<JobOpportunityDto>>(jsonString, jsonOptions) ?? new List<JobOpportunityDto>();
            }
            
            _logger.LogInformation("Received bulk job webhook request with {Count} jobs", jobDtos?.Count ?? 0);

            // Validate request body
            if (jobDtos == null || !jobDtos.Any())
            {
                _logger.LogWarning("Bulk job webhook request received with null or empty body");
                return BadRequest(new ApiResponse<BulkJobCreationResult>
                {
                    Success = false,
                    Message = "Request body is required and must contain at least one job",
                    Errors = new List<string> { "Job opportunity data list cannot be null or empty" }
                });
            }

            // Validate secret token configuration
            var expectedSecret = _configuration["WEBHOOK_SECRET"];
            if (string.IsNullOrEmpty(expectedSecret))
            {
                _logger.LogError("WEBHOOK_SECRET configuration is missing");
                return StatusCode(500, new ApiResponse<BulkJobCreationResult>
                {
                    Success = false,
                    Message = "Server configuration error",
                    Errors = new List<string> { "Webhook authentication not configured" }
                });
            }

            // Validate secret tokens for all jobs
            var authErrors = new List<string>();
            for (int i = 0; i < jobDtos.Count; i++)
            {
                var jobDto = jobDtos[i];
                if (jobDto == null)
                {
                    authErrors.Add($"Job at index {i} is null");
                    continue;
                }

                if (string.IsNullOrEmpty(jobDto.SecretToken) || jobDto.SecretToken != expectedSecret)
                {
                    authErrors.Add($"Job at index {i} has invalid or missing secret token (Company: {jobDto.Company ?? "Unknown"})");
                }
            }

            if (authErrors.Any())
            {
                _logger.LogWarning("Bulk job webhook authentication failed: {Errors}", string.Join("; ", authErrors));
                return Unauthorized(new ApiResponse<BulkJobCreationResult>
                {
                    Success = false,
                    Message = "Authentication failed for one or more jobs",
                    Errors = authErrors
                });
            }

            // Process bulk job creation
            var result = await _jobWebhookService.CreateJobOpportunitiesBulkAsync(jobDtos);

            // Determine response status based on results
            var responseMessage = result.IsCompleteSuccess 
                ? "All job opportunities created successfully"
                : result.IsPartialSuccess 
                    ? $"Partial success: {result.SuccessCount} created, {result.FailureCount} failed"
                    : "All job opportunities failed to be created";

            _logger.LogInformation("Bulk job webhook completed: {Message}", responseMessage);

            return Ok(new ApiResponse<BulkJobCreationResult>
            {
                Success = result.SuccessCount > 0, // Consider it successful if at least one job was created
                Message = responseMessage,
                Data = result
            });
        }
        catch (ArgumentNullException ex)
        {
            _logger.LogError(ex, "Null argument error in bulk job webhook: {Message}", ex.Message);
            return BadRequest(new ApiResponse<BulkJobCreationResult>
            {
                Success = false,
                Message = "Invalid request data",
                Errors = new List<string> { ex.Message }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in bulk job webhook: {Message}", ex.Message);
            return StatusCode(500, new ApiResponse<BulkJobCreationResult>
            {
                Success = false,
                Message = "An unexpected error occurred while processing the bulk request",
                Errors = new List<string> { "Internal server error" }
            });
        }
    }
}
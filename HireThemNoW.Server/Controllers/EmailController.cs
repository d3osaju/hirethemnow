using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;
using HireThemNoW.Server.Services;
using HireThemNoW.Server.Models;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmailController : ControllerBase
{
    private readonly IEmailCenterService _emailCenterService;
    private readonly ILogger<EmailController> _logger;
    private readonly IConfiguration _configuration;

    public EmailController(
        IEmailCenterService emailCenterService,
        ILogger<EmailController> logger,
        IConfiguration configuration)
    {
        _emailCenterService = emailCenterService ?? throw new ArgumentNullException(nameof(emailCenterService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
    }

    /// <summary>
    /// Performs constant-time string comparison to prevent timing attacks
    /// </summary>
    /// <param name="expected">Expected string value</param>
    /// <param name="actual">Actual string value to compare</param>
    /// <returns>True if strings are equal, false otherwise</returns>
    private static bool ConstantTimeEquals(string expected, string actual)
    {
        if (expected == null || actual == null)
            return expected == actual;

        if (expected.Length != actual.Length)
            return false;

        var expectedBytes = Encoding.UTF8.GetBytes(expected);
        var actualBytes = Encoding.UTF8.GetBytes(actual);

        return CryptographicOperations.FixedTimeEquals(expectedBytes, actualBytes);
    }

    /// <summary>
    /// Gets all unsent emails for the authenticated user
    /// </summary>
    /// <returns>List of user's unsent emails</returns>
    /// <response code="200">Successfully retrieved user's unsent emails</response>
    /// <response code="401">User not authenticated</response>
    /// <response code="500">Internal server error</response>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<EmailDto>>>> GetUserEmails()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("GetUserEmails called without valid user ID");
                return Unauthorized(new ApiResponse<List<EmailDto>>
                {
                    Success = false,
                    Message = "User not authenticated",
                    Errors = new List<string> { "Authentication required" }
                });
            }

            _logger.LogInformation("Retrieving unsent emails for user {UserId}", userId);

            var emails = await _emailCenterService.GetUserUnsentEmailsAsync(userId);
            
            var emailDtos = emails.Select(e => new EmailDto
            {
                Id = e.Id,
                ToEmail = e.ToEmail,
                Subject = e.Subject,
                Body = e.Body,
                ResumeUrl = e.ResumeUrl,
                CreatedAt = e.CreatedAt
            }).ToList();

            _logger.LogInformation("Successfully retrieved {Count} unsent emails for user {UserId}", emailDtos.Count, userId);

            return Ok(new ApiResponse<List<EmailDto>>
            {
                Success = true,
                Message = "Emails retrieved successfully",
                Data = emailDtos
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving emails for user");
            return StatusCode(500, new ApiResponse<List<EmailDto>>
            {
                Success = false,
                Message = "An error occurred while retrieving emails",
                Errors = new List<string> { "Internal server error" }
            });
        }
    }

    /// <summary>
    /// Marks an email as sent for the authenticated user
    /// </summary>
    /// <param name="id">Email ID to mark as sent</param>
    /// <returns>Success status of the operation</returns>
    /// <response code="200">Email successfully marked as sent</response>
    /// <response code="401">User not authenticated</response>
    /// <response code="404">Email not found or user not authorized</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("mark-sent/{id}")]
    public async Task<ActionResult<ApiResponse<object>>> MarkEmailAsSent(int id)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("MarkEmailAsSent called without valid user ID");
                return Unauthorized(new ApiResponse<object>
                {
                    Success = false,
                    Message = "User not authenticated",
                    Errors = new List<string> { "Authentication required" }
                });
            }

            _logger.LogInformation("Marking email {EmailId} as sent for user {UserId}", id, userId);

            var success = await _emailCenterService.MarkEmailAsSentAsync(id, userId);
            
            if (!success)
            {
                _logger.LogWarning("Email {EmailId} not found or user {UserId} not authorized", id, userId);
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Email not found or you are not authorized to modify this email",
                    Errors = new List<string> { "Email not found or unauthorized access" }
                });
            }

            _logger.LogInformation("Successfully marked email {EmailId} as sent for user {UserId}", id, userId);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Email marked as sent successfully",
                Data = new { emailId = id, status = "sent" }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking email {EmailId} as sent for user", id);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while updating email status",
                Errors = new List<string> { "Internal server error" }
            });
        }
    }

    /// <summary>
    /// Webhook endpoint for creating emails from external sources
    /// </summary>
    /// <param name="request">Email data from external source</param>
    /// <returns>Created email information</returns>
    /// <response code="200">Email created successfully</response>
    /// <response code="400">Invalid request data or validation errors</response>
    /// <response code="401">Invalid or missing webhook secret</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<EmailDto>>> CreateEmailViaWebhook([FromBody] WebhookEmailRequestWithSecret request)
    {
        try
        {
            _logger.LogInformation("Received email webhook request for user {UserId}", request?.UserId ?? "Unknown");

            // Validate request body
            if (request == null)
            {
                _logger.LogWarning("Email webhook request received with null body");
                return BadRequest(new ApiResponse<EmailDto>
                {
                    Success = false,
                    Message = "Request body is required",
                    Errors = new List<string> { "Email data cannot be null" }
                });
            }

            // Validate webhook secret for authentication
            var expectedSecret = _configuration["WEBHOOK_SECRET"];
            if (string.IsNullOrEmpty(expectedSecret))
            {
                _logger.LogError("WEBHOOK_SECRET configuration is missing - webhook authentication cannot proceed");
                return StatusCode(500, new ApiResponse<EmailDto>
                {
                    Success = false,
                    Message = "Server configuration error",
                    Errors = new List<string> { "Webhook authentication not configured" }
                });
            }

            // Log authentication attempt (before validation for security monitoring)
            var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
            var userAgent = Request.Headers.UserAgent.ToString();
            
            _logger.LogInformation("Webhook authentication attempt from IP {ClientIp} with User-Agent {UserAgent} for user {UserId}", 
                clientIp, userAgent, request.UserId ?? "Unknown");

            // Use constant-time comparison to prevent timing attacks
            var isSecretValid = !string.IsNullOrEmpty(request.SecretToken) && 
                               ConstantTimeEquals(expectedSecret, request.SecretToken);

            if (!isSecretValid)
            {
                // Log security event with details but don't reveal why authentication failed
                _logger.LogWarning("Webhook authentication failed from IP {ClientIp} for user {UserId} - " +
                                 "Secret token: {HasToken}, Token length: {TokenLength}", 
                    clientIp, 
                    request.UserId ?? "Unknown",
                    !string.IsNullOrEmpty(request.SecretToken) ? "Present" : "Missing",
                    request.SecretToken?.Length ?? 0);

                return Unauthorized(new ApiResponse<EmailDto>
                {
                    Success = false,
                    Message = "Authentication failed. Invalid or missing webhook secret token.",
                    Errors = new List<string> { "Webhook authentication required" }
                });
            }

            // Log successful authentication
            _logger.LogInformation("Webhook authentication successful from IP {ClientIp} for user {UserId}", 
                clientIp, request.UserId ?? "Unknown");

            // Validate model state (data annotations)
            if (!ModelState.IsValid)
            {
                var errors = new List<string>();
                
                foreach (var modelError in ModelState)
                {
                    var fieldName = modelError.Key;
                    var fieldErrors = modelError.Value?.Errors;
                    
                    if (fieldErrors != null && fieldErrors.Count > 0)
                    {
                        foreach (var error in fieldErrors)
                        {
                            var errorMessage = !string.IsNullOrEmpty(error.ErrorMessage) 
                                ? error.ErrorMessage 
                                : error.Exception?.Message ?? "Invalid value";
                            
                            // Create more descriptive error messages
                            var descriptiveError = fieldName switch
                            {
                                nameof(WebhookEmailRequestWithSecret.UserId) => $"UserId is required and cannot be empty",
                                nameof(WebhookEmailRequestWithSecret.ToEmail) => 
                                    errorMessage.Contains("email", StringComparison.OrdinalIgnoreCase) 
                                        ? $"ToEmail must be a valid email address format (e.g., user@example.com)"
                                        : $"ToEmail is required and cannot be empty",
                                nameof(WebhookEmailRequestWithSecret.Subject) => $"Subject is required and cannot be empty",
                                nameof(WebhookEmailRequestWithSecret.Body) => $"Body is required and cannot be empty",
                                nameof(WebhookEmailRequestWithSecret.SecretToken) => $"SecretToken is required for authentication",
                                _ => $"{fieldName}: {errorMessage}"
                            };
                            
                            errors.Add(descriptiveError);
                        }
                    }
                }

                _logger.LogWarning("Email webhook validation failed for user {UserId}: {Errors}", 
                    request.UserId ?? "Unknown", string.Join("; ", errors));
                
                return BadRequest(new ApiResponse<EmailDto>
                {
                    Success = false,
                    Message = "Request validation failed. Please check the required fields and their formats.",
                    Errors = errors
                });
            }

            // Create webhook email request without secret for service layer
            var webhookRequest = new WebhookEmailRequest
            {
                UserId = request.UserId,
                ToEmail = request.ToEmail,
                Subject = request.Subject,
                Body = request.Body,
                ResumeUrl = request.ResumeUrl
            };

            // Create email through service
            var createdEmail = await _emailCenterService.CreateEmailAsync(webhookRequest);

            var emailDto = new EmailDto
            {
                Id = createdEmail.Id,
                ToEmail = createdEmail.ToEmail,
                Subject = createdEmail.Subject,
                Body = createdEmail.Body,
                ResumeUrl = createdEmail.ResumeUrl,
                CreatedAt = createdEmail.CreatedAt
            };

            _logger.LogInformation("Successfully created email with ID {EmailId} for user {UserId} via webhook", 
                createdEmail.Id, createdEmail.UserId);

            return Ok(new ApiResponse<EmailDto>
            {
                Success = true,
                Message = "Email created successfully",
                Data = emailDto
            });
        }
        catch (ArgumentNullException ex)
        {
            _logger.LogError(ex, "Null argument error in email webhook: {Message}", ex.Message);
            return BadRequest(new ApiResponse<EmailDto>
            {
                Success = false,
                Message = "Invalid request data",
                Errors = new List<string> { ex.Message }
            });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error in email webhook: {Message}", ex.Message);
            return BadRequest(new ApiResponse<EmailDto>
            {
                Success = false,
                Message = "Validation failed",
                Errors = new List<string> { ex.Message }
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Database operation failed in email webhook: {Message}", ex.Message);
            return StatusCode(500, new ApiResponse<EmailDto>
            {
                Success = false,
                Message = "An error occurred while processing the email",
                Errors = new List<string> { "Database operation failed" }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in email webhook: {Message}", ex.Message);
            return StatusCode(500, new ApiResponse<EmailDto>
            {
                Success = false,
                Message = "An unexpected error occurred while processing the request",
                Errors = new List<string> { "Internal server error" }
            });
        }
    }
}

/// <summary>
/// Webhook email request with secret token for authentication
/// </summary>
public class WebhookEmailRequestWithSecret : WebhookEmailRequest
{
    [Required]
    public string SecretToken { get; set; } = string.Empty;
}
using Microsoft.EntityFrameworkCore;
using HireThemNoW.Server.Data;
using HireThemNoW.Server.Models;
using System.ComponentModel.DataAnnotations;

namespace HireThemNoW.Server.Services
{
    public class EmailCenterService : IEmailCenterService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<EmailCenterService> _logger;

        public EmailCenterService(ApplicationDbContext context, ILogger<EmailCenterService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<Email>> GetUserUnsentEmailsAsync(string userId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(userId))
                {
                    _logger.LogWarning("GetUserUnsentEmailsAsync called with null or empty userId");
                    return new List<Email>();
                }

                var emails = await _context.Emails
                    .Where(e => e.UserId == userId && !e.IsSent)
                    .OrderByDescending(e => e.CreatedAt)
                    .ToListAsync();

                _logger.LogInformation("Retrieved {Count} unsent emails for user {UserId}", emails.Count, userId);
                return emails;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving unsent emails for user {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> MarkEmailAsSentAsync(int emailId, string userId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(userId))
                {
                    _logger.LogWarning("MarkEmailAsSentAsync called with null or empty userId");
                    return false;
                }

                var email = await _context.Emails
                    .FirstOrDefaultAsync(e => e.Id == emailId && e.UserId == userId);

                if (email == null)
                {
                    _logger.LogWarning("Email with ID {EmailId} not found for user {UserId}", emailId, userId);
                    return false;
                }

                if (email.IsSent)
                {
                    _logger.LogInformation("Email with ID {EmailId} is already marked as sent", emailId);
                    return true;
                }

                email.IsSent = true;
                email.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Email with ID {EmailId} marked as sent for user {UserId}", emailId, userId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking email {EmailId} as sent for user {UserId}", emailId, userId);
                throw;
            }
        }

        public async Task<Email> CreateEmailAsync(WebhookEmailRequest request)
        {
            try
            {
                if (request == null)
                {
                    throw new ArgumentNullException(nameof(request), "Webhook request cannot be null");
                }

                if (!await ValidateWebhookRequestAsync(request))
                {
                    // The validation method already logs specific validation failures
                    // Check specific validation failures to provide detailed error messages
                    if (string.IsNullOrWhiteSpace(request.UserId))
                    {
                        throw new ArgumentException("UserId is required and cannot be empty");
                    }

                    var userExists = await _context.Users.AnyAsync(u => u.Id == request.UserId);
                    if (!userExists)
                    {
                        throw new ArgumentException($"User with ID '{request.UserId}' does not exist in the system");
                    }

                    if (string.IsNullOrWhiteSpace(request.ToEmail))
                    {
                        throw new ArgumentException("ToEmail is required and cannot be empty");
                    }

                    var emailAttribute = new EmailAddressAttribute();
                    if (!emailAttribute.IsValid(request.ToEmail))
                    {
                        throw new ArgumentException($"ToEmail '{request.ToEmail}' is not a valid email address format");
                    }

                    if (string.IsNullOrWhiteSpace(request.Subject))
                    {
                        throw new ArgumentException("Subject is required and cannot be empty");
                    }

                    if (request.Subject.Length > 500)
                    {
                        throw new ArgumentException("Subject cannot exceed 500 characters");
                    }

                    if (string.IsNullOrWhiteSpace(request.Body))
                    {
                        throw new ArgumentException("Body is required and cannot be empty");
                    }

                    if (!string.IsNullOrEmpty(request.ResumeUrl))
                    {
                        if (request.ResumeUrl.Length > 500)
                        {
                            throw new ArgumentException("ResumeUrl cannot exceed 500 characters");
                        }

                        if (!Uri.TryCreate(request.ResumeUrl, UriKind.Absolute, out var uri) || 
                            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
                        {
                            throw new ArgumentException($"ResumeUrl '{request.ResumeUrl}' is not a valid HTTP or HTTPS URL");
                        }
                    }

                    throw new ArgumentException("Webhook request validation failed");
                }

                var email = new Email
                {
                    UserId = request.UserId,
                    ToEmail = request.ToEmail,
                    Subject = request.Subject,
                    Body = request.Body,
                    ResumeUrl = request.ResumeUrl,
                    IsSent = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Emails.Add(email);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Created new email with ID {EmailId} for user {UserId} via webhook", email.Id, request.UserId);
                return email;
            }
            catch (ArgumentException)
            {
                // Re-throw argument exceptions as they contain user-friendly validation messages
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error creating email via webhook for user {UserId}", request?.UserId);
                throw new InvalidOperationException("An error occurred while creating the email. Please try again.", ex);
            }
        }

        public async Task<bool> ValidateWebhookRequestAsync(WebhookEmailRequest request)
        {
            try
            {
                if (request == null)
                {
                    _logger.LogWarning("Webhook request is null");
                    return false;
                }

                // Validate required fields
                if (string.IsNullOrWhiteSpace(request.UserId))
                {
                    _logger.LogWarning("Webhook request missing UserId");
                    return false;
                }

                if (string.IsNullOrWhiteSpace(request.ToEmail))
                {
                    _logger.LogWarning("Webhook request missing ToEmail");
                    return false;
                }

                if (string.IsNullOrWhiteSpace(request.Subject))
                {
                    _logger.LogWarning("Webhook request missing Subject");
                    return false;
                }

                if (string.IsNullOrWhiteSpace(request.Body))
                {
                    _logger.LogWarning("Webhook request missing Body");
                    return false;
                }

                // Validate user existence
                var userExists = await _context.Users.AnyAsync(u => u.Id == request.UserId);
                if (!userExists)
                {
                    _logger.LogWarning("Webhook request references non-existent user: {UserId}", request.UserId);
                    return false;
                }

                // Validate email format
                var emailAttribute = new EmailAddressAttribute();
                if (!emailAttribute.IsValid(request.ToEmail))
                {
                    _logger.LogWarning("Webhook request has invalid email format: {Email}", request.ToEmail);
                    return false;
                }

                // Validate field lengths
                if (request.Subject.Length > 500)
                {
                    _logger.LogWarning("Webhook request subject exceeds maximum length of 500 characters");
                    return false;
                }

                if (!string.IsNullOrEmpty(request.ResumeUrl) && request.ResumeUrl.Length > 500)
                {
                    _logger.LogWarning("Webhook request resume URL exceeds maximum length of 500 characters");
                    return false;
                }

                // Validate URL format if provided
                if (!string.IsNullOrEmpty(request.ResumeUrl))
                {
                    if (!Uri.TryCreate(request.ResumeUrl, UriKind.Absolute, out var uri) || 
                        (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
                    {
                        _logger.LogWarning("Webhook request has invalid resume URL format: {Url}", request.ResumeUrl);
                        return false;
                    }
                }

                _logger.LogInformation("Webhook request validation successful for user {UserId}", request.UserId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating webhook request for user {UserId}", request?.UserId);
                return false;
            }
        }
    }
}
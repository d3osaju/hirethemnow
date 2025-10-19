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
                if (!await ValidateWebhookRequestAsync(request))
                {
                    throw new ArgumentException("Invalid webhook request data");
                }

                // Check if user exists
                var userExists = await _context.Users.AnyAsync(u => u.Id == request.UserId);
                if (!userExists)
                {
                    throw new ArgumentException($"User with ID {request.UserId} does not exist");
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
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating email via webhook for user {UserId}", request?.UserId);
                throw;
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

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating webhook request");
                return false;
            }
        }
    }
}
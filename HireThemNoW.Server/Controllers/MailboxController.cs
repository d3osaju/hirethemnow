using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireThemNoW.Server.Models;
using HireThemNoW.Server.Services;
using System.Security.Claims;
using System.Text.Json;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MailboxController : ControllerBase
{
    private readonly IDataService _dataService;
    private readonly ILogger<MailboxController> _logger;

    public MailboxController(IDataService dataService, ILogger<MailboxController> logger)
    {
        _dataService = dataService;
        _logger = logger;
    }

    [HttpGet("emails")]
    public async Task<ActionResult<ApiResponse<List<MailboxEmail>>>> GetUserEmails()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<List<MailboxEmail>>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            // Get emails from the new email tracking tables
            var emailsSent = await _dataService.GetEmailsSentAsync(userId);
            var emailsReceived = await _dataService.GetEmailsReceivedAsync(userId);

            var mailboxEmails = new List<MailboxEmail>();

            // Add sent emails
            foreach (var sentEmail in emailsSent)
            {
                var mailboxEmail = new MailboxEmail
                {
                    Id = sentEmail.Id,
                    Type = "sent",
                    Subject = sentEmail.Subject,
                    Content = sentEmail.EmailContentHtml,
                    FromEmail = sentEmail.FromEmail,
                    ToEmail = sentEmail.ToEmail,
                    Company = ExtractCompanyFromEmail(sentEmail.ToEmail),
                    ContactName = "HR Representative",
                    SentAt = sentEmail.DateSent,
                    Status = sentEmail.Status,
                    HasAnalysis = false
                };

                mailboxEmails.Add(mailboxEmail);
            }

            // Add received emails
            foreach (var receivedEmail in emailsReceived)
            {
                var mailboxEmail = new MailboxEmail
                {
                    Id = receivedEmail.Id,
                    Type = "received",
                    Subject = receivedEmail.Subject,
                    Content = receivedEmail.EmailContentHtml,
                    FromEmail = receivedEmail.FromEmail,
                    ToEmail = receivedEmail.ToEmail,
                    Company = ExtractCompanyFromEmail(receivedEmail.FromEmail),
                    ContactName = "HR Representative",
                    ReceivedAt = receivedEmail.DateReceived,
                    Status = receivedEmail.Status,

                    // Analysis results from the new model
                    HasAnalysis = !string.IsNullOrEmpty(receivedEmail.ReplyType),
                    Sentiment = receivedEmail.SentimentScore ?? "Unknown",
                    EmailType = receivedEmail.ReplyType ?? "Unknown",
                    HasInterviewInvitation = receivedEmail.HasInterviewInvitation,
                    IsRejection = receivedEmail.IsRejection,
                    IsPositiveResponse = receivedEmail.IsPositiveResponse,
                    NextSteps = receivedEmail.NextAction
                };

                mailboxEmails.Add(mailboxEmail);
            }

            // Sort by most recent first
            mailboxEmails = mailboxEmails
                .OrderByDescending(e => e.ReceivedAt ?? e.SentAt ?? DateTime.MinValue)
                .ToList();

            return Ok(new ApiResponse<List<MailboxEmail>>
            {
                Success = true,
                Message = "Mailbox emails retrieved successfully",
                Data = mailboxEmails
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving mailbox emails");
            return StatusCode(500, new ApiResponse<List<MailboxEmail>>
            {
                Success = false,
                Message = "An error occurred while retrieving emails",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    private string ExtractCompanyFromEmail(string email)
    {
        if (string.IsNullOrEmpty(email) || !email.Contains('@'))
            return "Unknown Company";

        var domain = email.Split('@')[1];
        var companyName = domain.Split('.')[0];
        return char.ToUpper(companyName[0]) + companyName.Substring(1);
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<MailboxStats>>> GetMailboxStats()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<MailboxStats>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            var emailsSent = await _dataService.GetEmailsSentAsync(userId);
            var emailsReceived = await _dataService.GetEmailsReceivedAsync(userId);

            var stats = new MailboxStats
            {
                TotalSent = emailsSent.Count,
                TotalReplies = emailsReceived.Count,
                TotalOpened = 0, // This would need tracking implementation
                InterviewInvitations = emailsReceived.Count(e => e.HasInterviewInvitation),
                Rejections = emailsReceived.Count(e => e.IsRejection),
                PositiveResponses = emailsReceived.Count(e => e.IsPositiveResponse),
                PendingResponses = emailsReceived.Count(e => e.Status == "pending")
            };

            return Ok(new ApiResponse<MailboxStats>
            {
                Success = true,
                Message = "Mailbox statistics retrieved successfully",
                Data = stats
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving mailbox statistics");
            return StatusCode(500, new ApiResponse<MailboxStats>
            {
                Success = false,
                Message = "An error occurred while retrieving statistics",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}

// DTOs for mailbox display
public class MailboxEmail
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // "sent" or "received"
    public string Subject { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string ToEmail { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string ContactName { get; set; } = string.Empty;
    public DateTime? SentAt { get; set; }
    public DateTime? ReceivedAt { get; set; }
    public string Status { get; set; } = string.Empty;

    // AI Analysis results for badges
    public bool HasAnalysis { get; set; } = false;
    public string Sentiment { get; set; } = string.Empty; // "Positive", "Negative", "Interview", "Neutral"
    public string EmailType { get; set; } = string.Empty;
    public bool HasInterviewInvitation { get; set; } = false;
    public bool IsRejection { get; set; } = false;
    public bool IsPositiveResponse { get; set; } = false;
    public DateTime? InterviewDate { get; set; }
    public string? InterviewDetails { get; set; }
    public string? NextSteps { get; set; }
}

public class MailboxStats
{
    public int TotalSent { get; set; }
    public int TotalReplies { get; set; }
    public int TotalOpened { get; set; }
    public int InterviewInvitations { get; set; }
    public int Rejections { get; set; }
    public int PositiveResponses { get; set; }
    public int PendingResponses { get; set; }
}

public class EmailReplyReceived
{
    public string OutreachId { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public DateTime ReceivedAt { get; set; }
}
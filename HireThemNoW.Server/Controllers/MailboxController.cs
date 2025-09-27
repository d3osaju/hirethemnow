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

            var outreaches = await _dataService.GetUserEmailsAsync(userId);
            var mailboxEmails = new List<MailboxEmail>();

            foreach (var outreach in outreaches)
            {
                // Get HR contact details
                var hrContact = await _dataService.GetHRContactAsync(outreach.HRContactId);

                // Get email analysis if reply exists
                EmailAnalysis? analysis = null;
                if (!string.IsNullOrEmpty(outreach.ReplyEmail))
                {
                    analysis = await _dataService.GetEmailAnalysisByOutreachIdAsync(outreach.Id);
                }

                var mailboxEmail = new MailboxEmail
                {
                    Id = outreach.Id,
                    Type = !string.IsNullOrEmpty(outreach.ReplyEmail) ? "received" : "sent",
                    Subject = outreach.EmailSubject,
                    Content = !string.IsNullOrEmpty(outreach.ReplyEmail) ? outreach.ReplyBody ?? "" : outreach.EmailBody,
                    FromEmail = !string.IsNullOrEmpty(outreach.ReplyEmail) ? hrContact?.Email ?? "Unknown" : outreach.FromEmail,
                    ToEmail = !string.IsNullOrEmpty(outreach.ReplyEmail) ? outreach.FromEmail : hrContact?.Email ?? "Unknown",
                    Company = hrContact?.Company ?? "Unknown Company",
                    ContactName = hrContact?.Name ?? "HR Representative",
                    SentAt = outreach.SentAt,
                    ReceivedAt = outreach.RepliedAt,
                    Status = outreach.Status,

                    // AI Analysis results
                    HasAnalysis = analysis != null,
                    Sentiment = analysis?.Sentiment.ToString() ?? "Unknown",
                    EmailType = analysis?.Type.ToString() ?? "Unknown",
                    HasInterviewInvitation = analysis?.HasInterviewInvitation ?? false,
                    IsRejection = analysis?.IsRejection ?? false,
                    IsPositiveResponse = analysis?.IsPositiveResponse ?? false,
                    InterviewDate = analysis?.InterviewDate,
                    InterviewDetails = analysis?.InterviewDetails,
                    NextSteps = analysis?.NextSteps
                };

                mailboxEmails.Add(mailboxEmail);

                // If there's a reply, also add the original sent email
                if (!string.IsNullOrEmpty(outreach.ReplyEmail))
                {
                    var sentEmail = new MailboxEmail
                    {
                        Id = outreach.Id + "_sent",
                        Type = "sent",
                        Subject = outreach.EmailSubject,
                        Content = outreach.EmailBody,
                        FromEmail = outreach.FromEmail,
                        ToEmail = hrContact?.Email ?? "Unknown",
                        Company = hrContact?.Company ?? "Unknown Company",
                        ContactName = hrContact?.Name ?? "HR Representative",
                        SentAt = outreach.SentAt,
                        Status = "sent",
                        HasAnalysis = false
                    };

                    mailboxEmails.Add(sentEmail);
                }
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

            var outreaches = await _dataService.GetUserEmailsAsync(userId);

            var stats = new MailboxStats
            {
                TotalSent = outreaches.Count(o => o.SentAt.HasValue),
                TotalReplies = outreaches.Count(o => !string.IsNullOrEmpty(o.ReplyEmail)),
                TotalOpened = outreaches.Count(o => o.OpenedAt.HasValue),
                InterviewInvitations = 0, // Will be calculated from analyses
                Rejections = 0,
                PositiveResponses = 0,
                PendingResponses = outreaches.Count(o => string.IsNullOrEmpty(o.ReplyEmail) && o.SentAt.HasValue)
            };

            // Calculate analysis-based stats
            foreach (var outreach in outreaches.Where(o => !string.IsNullOrEmpty(o.ReplyEmail)))
            {
                var analysis = await _dataService.GetEmailAnalysisByOutreachIdAsync(outreach.Id);
                if (analysis != null)
                {
                    if (analysis.HasInterviewInvitation) stats.InterviewInvitations++;
                    if (analysis.IsRejection) stats.Rejections++;
                    if (analysis.IsPositiveResponse) stats.PositiveResponses++;
                }
            }

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

    // N8N Webhook to receive email analysis results
    [HttpPost("analysis/result")]
    public async Task<ActionResult<ApiResponse<object>>> ReceiveEmailAnalysis([FromBody] EmailAnalysisResult result)
    {
        try
        {
            var outreach = await _dataService.GetColdEmailOutreachAsync(result.OutreachId);
            if (outreach == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Email outreach not found"
                });
            }

            var emailAnalysis = new EmailAnalysis
            {
                OutreachId = result.OutreachId,
                EmailContent = outreach.ReplyBody ?? "",
                Sentiment = result.Sentiment,
                Type = result.Type,
                ConfidenceScore = result.ConfidenceScore,
                HasInterviewInvitation = result.HasInterviewInvitation,
                InterviewDate = result.InterviewDate,
                InterviewDetails = result.InterviewDetails,
                IsRejection = result.IsRejection,
                RejectionReason = result.RejectionReason,
                IsPositiveResponse = result.IsPositiveResponse,
                NextSteps = result.NextSteps,
                AnalysisStatus = "completed"
            };

            await _dataService.CreateEmailAnalysisAsync(emailAnalysis);

            _logger.LogInformation("Email analysis completed for outreach {OutreachId}: {Sentiment} - {Type}",
                result.OutreachId, result.Sentiment, result.Type);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Email analysis processed successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing email analysis");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while processing the analysis",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    // N8N Webhook to receive new reply emails
    [HttpPost("reply/received")]
    public async Task<ActionResult<ApiResponse<object>>> ReceiveReply([FromBody] EmailReplyReceived reply)
    {
        try
        {
            var outreach = await _dataService.GetColdEmailOutreachAsync(reply.OutreachId);
            if (outreach == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Email outreach not found"
                });
            }

            // Update outreach with reply
            outreach.Status = "replied";
            outreach.RepliedAt = reply.ReceivedAt;
            outreach.ReplyEmail = reply.FromEmail;
            outreach.ReplySubject = reply.Subject;
            outreach.ReplyBody = reply.Body;

            await _dataService.UpdateColdEmailOutreachAsync(outreach);

            // Trigger email analysis
            await TriggerEmailAnalysisWorkflow(new EmailAnalysisRequest
            {
                OutreachId = reply.OutreachId,
                EmailSubject = reply.Subject,
                EmailBody = reply.Body,
                SenderEmail = reply.FromEmail,
                ReceivedAt = reply.ReceivedAt
            });

            _logger.LogInformation("Reply received for outreach {OutreachId} from {FromEmail}",
                reply.OutreachId, reply.FromEmail);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Reply processed successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing email reply");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while processing the reply",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    private async Task TriggerEmailAnalysisWorkflow(EmailAnalysisRequest request)
    {
        try
        {
            // TODO: Replace with your actual N8N webhook URL
            var n8nWebhookUrl = "https://your-n8n-instance.com/webhook/email-analysis";

            using var httpClient = new HttpClient();
            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await httpClient.PostAsync(n8nWebhookUrl, content);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Failed to trigger email analysis N8N workflow: {StatusCode} {ReasonPhrase}",
                    response.StatusCode, response.ReasonPhrase);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error triggering email analysis N8N workflow");
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
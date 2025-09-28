using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireThemNoW.Server.Models;

[Table("EmailsReceived")]
public class EmailReceived
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string FromEmail { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string ToEmail { get; set; } = string.Empty;

    [Required]
    public string Subject { get; set; } = string.Empty;

    [Required]
    public string EmailContentHtml { get; set; } = string.Empty;

    public string? EmailContentText { get; set; }

    [Required]
    public DateTime DateReceived { get; set; } = DateTime.UtcNow;

    public DateTime? DateSent { get; set; } // Original send date if this is a reply

    [Required]
    public string Status { get; set; } = "pending"; // pending, approved, rejected, interview_scheduled, no_response

    public string? ReplyType { get; set; } // positive, negative, neutral, interview_invitation, rejection

    public bool IsPositiveResponse { get; set; } = false;

    public bool IsRejection { get; set; } = false;

    public bool HasInterviewInvitation { get; set; } = false;

    public bool IsAutoReply { get; set; } = false;

    public string? OriginalEmailId { get; set; } // Reference to original sent email

    public string? MessageId { get; set; } // External email service message ID

    public string? InReplyToMessageId { get; set; } // Message ID this is replying to

    public string? CampaignId { get; set; } // For grouping related emails

    public string? HRContactId { get; set; } // Reference to HR contact

    public string? JobId { get; set; } // Reference to job if applicable

    // AI Analysis fields
    public string? SentimentScore { get; set; } // positive, negative, neutral (0-1 scale)

    public string? KeyWords { get; set; } // JSON array of important keywords found

    public string? NextAction { get; set; } // suggested next action

    public DateTime? AnalyzedAt { get; set; } // When AI analysis was performed

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User? User { get; set; }

    [ForeignKey("OriginalEmailId")]
    public virtual EmailSent? OriginalEmail { get; set; }

    [ForeignKey("HRContactId")]
    public virtual HRContact? HRContact { get; set; }
}
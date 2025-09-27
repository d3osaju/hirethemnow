namespace HireThemNoW.Server.Models;

public class ColdEmailCampaign
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string ResumeAnalysisId { get; set; } = string.Empty;

    // Campaign details
    public string CampaignName { get; set; } = string.Empty;
    public string SelectedTemplate { get; set; } = string.Empty; // Which template (1-5) was used
    public string CustomizedTemplate { get; set; } = string.Empty; // Final template used

    // Target filtering
    public List<string> TargetIndustries { get; set; } = new();
    public List<string> TargetSkills { get; set; } = new();

    // Campaign status
    public string Status { get; set; } = "draft"; // draft, active, paused, completed
    public int TotalEmails { get; set; } = 0;
    public int EmailsSent { get; set; } = 0;
    public int EmailsOpened { get; set; } = 0;
    public int EmailsReplied { get; set; } = 0;

    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Navigation
    public User? User { get; set; }
    public ResumeAnalysis? ResumeAnalysis { get; set; }
    public List<ColdEmailOutreach> Outreaches { get; set; } = new();
}

public class ColdEmailOutreach
{
    public string Id { get; set; } = string.Empty;
    public string CampaignId { get; set; } = string.Empty;
    public string HRContactId { get; set; } = string.Empty;

    // Email details
    public string EmailSubject { get; set; } = string.Empty;
    public string EmailBody { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty; // testmail.app email

    // Tracking
    public string Status { get; set; } = "pending"; // pending, sent, delivered, opened, replied, bounced
    public DateTime? SentAt { get; set; }
    public DateTime? OpenedAt { get; set; }
    public DateTime? RepliedAt { get; set; }

    // Response tracking
    public string? ReplyEmail { get; set; }
    public string? ReplySubject { get; set; }
    public string? ReplyBody { get; set; }

    // Error handling
    public string? ErrorMessage { get; set; }
    public int RetryCount { get; set; } = 0;

    // Navigation
    public ColdEmailCampaign? Campaign { get; set; }
    public HRContact? HRContact { get; set; }
}

// DTOs for N8N integration
public class ColdEmailRequest
{
    public string UserId { get; set; } = string.Empty;
    public string CampaignId { get; set; } = string.Empty;
    public List<string> TargetIndustries { get; set; } = new();
    public List<string> TargetSkills { get; set; } = new();
    public string EmailTemplate { get; set; } = string.Empty;
    public int MaxEmails { get; set; } = 50; // Daily limit
}

public class EmailResponse
{
    public string OutreachId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? Timestamp { get; set; }
    public string? ReplyContent { get; set; }
    public string? ErrorMessage { get; set; }
}
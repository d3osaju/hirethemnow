namespace HireThemNoW.Server.Models;

public class EmailAnalysis
{
    public string Id { get; set; } = string.Empty;
    public string OutreachId { get; set; } = string.Empty;
    public string EmailContent { get; set; } = string.Empty;

    // AI Analysis Results
    public EmailSentiment Sentiment { get; set; } = EmailSentiment.Neutral;
    public EmailType Type { get; set; } = EmailType.Unknown;
    public double ConfidenceScore { get; set; } = 0.0;

    // Extracted Information
    public bool HasInterviewInvitation { get; set; } = false;
    public DateTime? InterviewDate { get; set; }
    public string? InterviewDetails { get; set; }
    public bool IsRejection { get; set; } = false;
    public string? RejectionReason { get; set; }
    public bool IsPositiveResponse { get; set; } = false;
    public string? NextSteps { get; set; }

    // Analysis metadata
    public DateTime AnalyzedAt { get; set; } = DateTime.UtcNow;
    public string AnalysisStatus { get; set; } = "pending"; // pending, completed, failed
    public string? ErrorMessage { get; set; }

    // Navigation
    public ColdEmailOutreach? Outreach { get; set; }
}

public enum EmailSentiment
{
    Positive,    // Interested, wants to talk
    Negative,    // Rejection, not interested
    Neutral,     // Acknowledgment, uncertain
    Interview    // Direct interview invitation
}

public enum EmailType
{
    Unknown,
    InterviewInvitation,
    Rejection,
    RequestForMoreInfo,
    AutoReply,
    PositiveInterest,
    NegativeResponse,
    Referral
}

// For AI analysis request/response
public class EmailAnalysisRequest
{
    public string OutreachId { get; set; } = string.Empty;
    public string EmailSubject { get; set; } = string.Empty;
    public string EmailBody { get; set; } = string.Empty;
    public string SenderEmail { get; set; } = string.Empty;
    public DateTime ReceivedAt { get; set; }
}

public class EmailAnalysisResult
{
    public string OutreachId { get; set; } = string.Empty;
    public EmailSentiment Sentiment { get; set; }
    public EmailType Type { get; set; }
    public double ConfidenceScore { get; set; }
    public bool HasInterviewInvitation { get; set; }
    public DateTime? InterviewDate { get; set; }
    public string? InterviewDetails { get; set; }
    public bool IsRejection { get; set; }
    public string? RejectionReason { get; set; }
    public bool IsPositiveResponse { get; set; }
    public string? NextSteps { get; set; }
    public string Summary { get; set; } = string.Empty;
}
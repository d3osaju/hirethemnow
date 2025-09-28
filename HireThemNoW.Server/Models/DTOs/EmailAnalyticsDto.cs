namespace HireThemNoW.Server.Models.DTOs;

public class EmailAnalyticsDto
{
    public EmailCampaignSummary CampaignSummary { get; set; } = new();
    public List<EmailPerformanceMetric> PerformanceMetrics { get; set; } = new();
    public List<ResponseAnalytic> ResponseAnalytics { get; set; } = new();
    public List<TimeSeriesData> EmailTrends { get; set; } = new();
    public EmailEngagementStats EngagementStats { get; set; } = new();
}

public class EmailCampaignSummary
{
    public int TotalEmailsSent { get; set; }
    public int TotalEmailsReceived { get; set; }
    public int TotalReplies { get; set; }
    public int PositiveResponses { get; set; }
    public int Rejections { get; set; }
    public int InterviewInvitations { get; set; }
    public int PendingResponses { get; set; }
    public int NoResponses { get; set; }
    public double ResponseRate { get; set; } // Percentage
    public double PositiveResponseRate { get; set; } // Percentage
    public double InterviewRate { get; set; } // Percentage
    public double RejectionRate { get; set; } // Percentage
    public DateTime? FirstEmailSent { get; set; }
    public DateTime? LastEmailSent { get; set; }
    public DateTime? LastResponseReceived { get; set; }
}

public class EmailPerformanceMetric
{
    public string Period { get; set; } = string.Empty; // daily, weekly, monthly
    public DateTime Date { get; set; }
    public int EmailsSent { get; set; }
    public int EmailsReceived { get; set; }
    public int Replies { get; set; }
    public int PositiveResponses { get; set; }
    public int Rejections { get; set; }
    public int InterviewInvitations { get; set; }
    public double ResponseRate { get; set; }
    public double PositiveRate { get; set; }
}

public class ResponseAnalytic
{
    public string ResponseType { get; set; } = string.Empty; // positive, negative, interview, rejection, auto_reply
    public int Count { get; set; }
    public double Percentage { get; set; }
    public List<string> CommonKeywords { get; set; } = new();
    public double AverageResponseTime { get; set; } // Hours
}

public class TimeSeriesData
{
    public DateTime Date { get; set; }
    public string Label { get; set; } = string.Empty;
    public double Value { get; set; }
    public string Category { get; set; } = string.Empty; // sent, received, positive, negative
}

public class EmailEngagementStats
{
    public double AverageResponseTimeHours { get; set; }
    public int EmailsWithNoResponse { get; set; }
    public int EmailsWithQuickResponse { get; set; } // Responded within 24 hours
    public int EmailsWithSlowResponse { get; set; } // Responded after 7 days
    public Dictionary<string, int> ResponsesByDayOfWeek { get; set; } = new();
    public Dictionary<string, int> ResponsesByHourOfDay { get; set; } = new();
    public Dictionary<string, int> TopDomains { get; set; } = new(); // Which companies respond most
}

public class CampaignComparisonDto
{
    public string CampaignId { get; set; } = string.Empty;
    public string CampaignName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public EmailCampaignSummary Summary { get; set; } = new();
    public List<string> TopPerformingSubjects { get; set; } = new();
    public List<string> TopRespondingCompanies { get; set; } = new();
}

public class EmailAnalyticsFilter
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? CampaignId { get; set; }
    public string? Status { get; set; }
    public string? ResponseType { get; set; }
    public string? Domain { get; set; }
    public bool IncludeAutoReplies { get; set; } = false;
    public string GroupBy { get; set; } = "day"; // day, week, month
}
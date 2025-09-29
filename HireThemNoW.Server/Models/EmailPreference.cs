namespace HireThemNoW.Server.Models;

public class EmailPreference
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public bool WeeklyPerformanceReport { get; set; } = false;
    public bool MarketingEmails { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public User? User { get; set; }
}

public class UpdateEmailPreferenceRequest
{
    public bool? WeeklyPerformanceReport { get; set; }
    public bool? MarketingEmails { get; set; }
}
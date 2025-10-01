namespace HireThemNoW.Server.Models;

public class User
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "candidate"; // "candidate" or "employer"
    public string? Picture { get; set; }
    public string? Phone { get; set; }
    public string? Location { get; set; }
    public string? Bio { get; set; }
    public List<string> Skills { get; set; } = new();
    public string? Title { get; set; }
    public string? Industry { get; set; }
    public string? Experience { get; set; }
    public string? ResumeUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsCompleted { get; set; } = false; // Onboarding completion status

    // Trial/Subscription fields
    public DateTime TrialStartDate { get; set; } = DateTime.UtcNow;
    public DateTime TrialEndDate { get; set; } = DateTime.UtcNow.AddDays(7);
    public bool IsTrialActive { get; set; } = true;
    public bool HasSeenTrialEndMessage { get; set; } = false;
    public bool HasActiveSubscription { get; set; } = false;

    // Privacy settings
    public string ProfileVisibility { get; set; } = "public"; // "public", "private", "connections"
    public bool AllowAnalyticsDataSharing { get; set; } = true;

    // Helper method to check if user has access
    public bool HasAccess()
    {
        // User has access if trial is active OR subscription is active
        var isTrialValid = IsTrialActive && DateTime.UtcNow < TrialEndDate;
        return isTrialValid || HasActiveSubscription;
    }
}

public class CreateUserRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = "candidate";
}

public class UpdateUserRequest
{
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public string? Location { get; set; }
    public string? Bio { get; set; }
    public List<string>? Skills { get; set; }
    public string? Title { get; set; }
    public string? Industry { get; set; }
    public string? Experience { get; set; }
    public string? ResumeUrl { get; set; }
    public string? Picture { get; set; }
    public bool? IsCompleted { get; set; }
}
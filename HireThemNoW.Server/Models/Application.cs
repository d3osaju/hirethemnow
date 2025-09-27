namespace HireThemNoW.Server.Models;

public class Application
{
    public string Id { get; set; } = string.Empty;
    public string JobId { get; set; } = string.Empty;
    public string CandidateId { get; set; } = string.Empty;
    public string? CoverLetter { get; set; }
    public string? ResumeUrl { get; set; }
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Applied;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties for API responses
    public Job? Job { get; set; }
    public User? Candidate { get; set; }
}

public enum ApplicationStatus
{
    Applied,
    Reviewing,
    Interview,
    Rejected,
    Accepted
}

public class CreateApplicationRequest
{
    public string? CoverLetter { get; set; }
    public string? ResumeUrl { get; set; }
}

public class UpdateApplicationStatusRequest
{
    public ApplicationStatus Status { get; set; }
}
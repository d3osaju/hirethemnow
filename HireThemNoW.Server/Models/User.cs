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
    public string? ResumeUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsCompleted { get; set; } = false; // Onboarding completion status
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
    public string? ResumeUrl { get; set; }
    public bool? IsCompleted { get; set; }
}
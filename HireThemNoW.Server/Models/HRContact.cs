namespace HireThemNoW.Server.Models;

public class HRContact
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Company { get; set; }
    public string? JobTitle { get; set; }
    public string? LinkedIn { get; set; }

    // Industry and Skills for grouping
    public string Industry { get; set; } = string.Empty;
    public List<string> RelevantSkills { get; set; } = new();

    // Contact source info
    public string Source { get; set; } = string.Empty; // website, linkedin, etc.
    public string? SourceUrl { get; set; }

    // Outreach tracking
    public bool IsContacted { get; set; } = false;
    public DateTime? LastContactedAt { get; set; }
    public int ContactAttempts { get; set; } = 0;

    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
}

public class HRContactRequest
{
    public List<HRContactData> Contacts { get; set; } = new();
    public string Industry { get; set; } = string.Empty;
    public List<string> Skills { get; set; } = new();
}

public class HRContactData
{
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Company { get; set; }
    public string? JobTitle { get; set; }
    public string? LinkedIn { get; set; }
    public string Source { get; set; } = string.Empty;
    public string? SourceUrl { get; set; }
}
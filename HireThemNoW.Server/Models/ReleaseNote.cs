namespace HireThemNoW.Server.Models;

public class ReleaseNote
{
    public int Id { get; set; }
    public string Version { get; set; } = string.Empty;
    public DateTime ReleaseDate { get; set; }
    public List<string> Features { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsPublished { get; set; } = true;
}

public class CreateReleaseNoteRequest
{
    public string Version { get; set; } = string.Empty;
    public DateTime ReleaseDate { get; set; }
    public List<string> Features { get; set; } = new();
    public bool IsPublished { get; set; } = true;
}

public class UpdateReleaseNoteRequest
{
    public string? Version { get; set; }
    public DateTime? ReleaseDate { get; set; }
    public List<string>? Features { get; set; }
    public bool? IsPublished { get; set; }
}

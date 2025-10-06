namespace HireThemNoW.Server.Models;

public class ParsedResumeResult
{
    public string PlainText { get; set; } = string.Empty;
    public StructuredResumeContent StructuredContent { get; set; } = new();
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
}

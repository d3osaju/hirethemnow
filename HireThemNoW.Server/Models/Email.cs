using System.ComponentModel.DataAnnotations;

namespace HireThemNoW.Server.Models;

public class Email
{
    public int Id { get; set; }
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    public string ToEmail { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(500)]
    public string Subject { get; set; } = string.Empty;
    
    [Required]
    public string Body { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? ResumeUrl { get; set; }
    
    public bool IsSent { get; set; } = false;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation property
    public User User { get; set; } = null!;
}

public class EmailDto
{
    public int Id { get; set; }
    public string ToEmail { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? ResumeUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class WebhookEmailRequest
{
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    public string ToEmail { get; set; } = string.Empty;
    
    [Required]
    public string Subject { get; set; } = string.Empty;
    
    [Required]
    public string Body { get; set; } = string.Empty;
    
    public string? ResumeUrl { get; set; }
}
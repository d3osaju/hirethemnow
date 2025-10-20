using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireThemNoW.Server.Models;

public class ColdMailGenerationHistory
{
    public int Id { get; set; }
    
    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    public int JobId { get; set; }
    
    public bool IsSent { get; set; } = false;

    // Navigation property
    // Navigation properties
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;

    [ForeignKey("JobId")]
    public JobOpportunity JobOpportunity { get; set; } = null!;
}

public class ColdMailGenerationHistoryDto
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;

    public int JobId { get; set; }

    public bool IsSent { get; set; } = false;
}

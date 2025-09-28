using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireThemNoW.Server.Models;

[Table("EmailsSent")]
public class EmailSent
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string ToEmail { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string FromEmail { get; set; } = string.Empty;

    [Required]
    public string Subject { get; set; } = string.Empty;

    [Required]
    public string EmailContentHtml { get; set; } = string.Empty;

    public string? EmailContentText { get; set; }

    [Required]
    public DateTime DateSent { get; set; } = DateTime.UtcNow;

    [Required]
    public string Status { get; set; } = "sent"; // sent, delivered, bounced, failed

    public string? MessageId { get; set; } // External email service message ID

    public string? CampaignId { get; set; } // For grouping related emails

    public string? HRContactId { get; set; } // Reference to HR contact if applicable

    public string? JobId { get; set; } // Reference to job if applicable

    public string? ErrorMessage { get; set; } // If failed

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User? User { get; set; }

    [ForeignKey("HRContactId")]
    public virtual HRContact? HRContact { get; set; }

    // One-to-many relationship with received emails (replies)
    public virtual ICollection<EmailReceived> Replies { get; set; } = new List<EmailReceived>();
}
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireThemNoW.Server.Models
{
    [Table("job_opportunities")]
    public class JobOpportunity
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("job_title")]
        [MaxLength(500)]
        public string JobTitle { get; set; } = string.Empty;

        [Required]
        [Column("company")]
        [MaxLength(200)]
        public string Company { get; set; } = string.Empty;

        [Column("location")]
        [MaxLength(200)]
        public string Location { get; set; } = string.Empty;

        [Column("emails")]
        public string Emails { get; set; } = string.Empty;

        [Column("email_type")]
        [MaxLength(50)]
        public string EmailType { get; set; } = "summary";

        [Column("is_remote")]
        public bool IsRemote { get; set; } = false;

        [Column("salary")]
        [MaxLength(100)]
        public string Salary { get; set; } = string.Empty;

        [Column("link")]
        public string Link { get; set; } = string.Empty;

        [Column("snippet")]
        public string Snippet { get; set; } = string.Empty;

        [Column("scraped_date")]
        public DateTime? ScrapedDate { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
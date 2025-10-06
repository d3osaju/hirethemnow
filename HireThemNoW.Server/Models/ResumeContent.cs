using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireThemNoW.Server.Models
{
    [Table("resume_contents")]
    public class ResumeContent
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("user_id")]
        public string UserId { get; set; } = string.Empty;

        [Column("s3_key")]
        public string S3Key { get; set; } = string.Empty;

        [Column("file_name")]
        public string FileName { get; set; } = string.Empty;

        [Column("content_type")]
        public string ContentType { get; set; } = string.Empty; // pdf, doc, docx

        [Column("parsed_content")]
        public string ParsedContent { get; set; } = string.Empty; // Full JSON content

        [Column("text_content")]
        public string? TextContent { get; set; } // Plain text extraction

        [Column("parsing_status")]
        public string ParsingStatus { get; set; } = "pending"; // pending, processing, completed, failed

        [Column("parsing_error")]
        public string? ParsingError { get; set; }

        [Column("file_size_bytes")]
        public long FileSizeBytes { get; set; }

        [Column("uploaded_at")]
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        [Column("parsed_at")]
        public DateTime? ParsedAt { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
    }
}
using System.ComponentModel.DataAnnotations;

namespace HireThemNoW.Server.Models
{
    /// <summary>
    /// DTO representing the status of a resume analysis operation
    /// </summary>
    public class AnalysisStatusDto
    {
        /// <summary>
        /// Current status of the analysis
        /// Possible values: "waiting_for_parsing", "processing", "completed", "failed"
        /// </summary>
        [Required]
        public string Status { get; set; } = string.Empty;

        /// <summary>
        /// User-friendly message describing the current status
        /// </summary>
        public string? Message { get; set; }

        /// <summary>
        /// Overall ATS score (0-100) - only available when status is "completed"
        /// </summary>
        [Range(0, 100)]
        public int? OverallScore { get; set; }

        /// <summary>
        /// Date and time when the analysis was completed
        /// </summary>
        public DateTime? CompletedAt { get; set; }

        /// <summary>
        /// Error message if the analysis failed
        /// </summary>
        public string? ErrorMessage { get; set; }
    }
}
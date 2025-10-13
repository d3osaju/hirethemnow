using System.ComponentModel.DataAnnotations;

namespace HireThemNoW.Server.Models
{
    /// <summary>
    /// Model representing detailed feedback for a specific section of a resume
    /// </summary>
    public class SectionFeedback
    {
        /// <summary>
        /// Name of the resume section (e.g., "personalInfo", "summary", "experience", "education", "skills", "certifications", "projects")
        /// </summary>
        [Required]
        public string SectionName { get; set; } = string.Empty;

        /// <summary>
        /// Score for this specific section (0-100)
        /// </summary>
        [Range(0, 100)]
        public int Score { get; set; }

        /// <summary>
        /// List of issues identified in this section
        /// </summary>
        public List<string> Issues { get; set; } = new();

        /// <summary>
        /// List of suggestions for improving this section
        /// </summary>
        public List<string> Suggestions { get; set; } = new();
    }
}
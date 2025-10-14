using System.ComponentModel.DataAnnotations;

namespace HireThemNoW.Server.Models
{
    /// <summary>
    /// DTO for API responses containing resume analysis results with properly typed array and object properties.
    /// This DTO transforms JSON string fields from the ResumeAnalysis entity into proper .NET types.
    /// </summary>
    public class ResumeAnalysisResultDto
    {
        /// <summary>
        /// Unique identifier for the analysis
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// User ID who owns this analysis
        /// </summary>
        [Required]
        public string UserId { get; set; } = string.Empty;

        /// <summary>
        /// Foreign key to the ResumeContent record
        /// </summary>
        public int? ResumeContentId { get; set; }

        /// <summary>
        /// Analysis status: "waiting_for_parsing", "processing", "completed", "failed"
        /// </summary>
        [Required]
        public string Status { get; set; } = string.Empty;

        /// <summary>
        /// Resume URL (S3 key or URL)
        /// </summary>
        public string? ResumeUrl { get; set; }

        /// <summary>
        /// Personal information from resume (JSON object)
        /// </summary>
        public string? PersonalInfo { get; set; }

        /// <summary>
        /// Technical skills from resume (JSON array)
        /// </summary>
        public string? TechnicalSkills { get; set; }

        /// <summary>
        /// Soft skills from resume (JSON array)
        /// </summary>
        public string? SoftSkills { get; set; }

        /// <summary>
        /// Programming languages from resume (JSON array)
        /// </summary>
        public string? ProgrammingLanguages { get; set; }

        /// <summary>
        /// Tools and technologies from resume (JSON array)
        /// </summary>
        public string? Tools { get; set; }

        /// <summary>
        /// Experience summary from resume
        /// </summary>
        public string? ExperienceSummary { get; set; }

        /// <summary>
        /// Education information from resume (JSON array)
        /// </summary>
        public string? Education { get; set; }

        /// <summary>
        /// Certifications from resume (JSON array)
        /// </summary>
        public string? Certifications { get; set; }

        /// <summary>
        /// Resume summary/objective
        /// </summary>
        public string? Summary { get; set; }

        /// <summary>
        /// Years of experience extracted from resume
        /// </summary>
        public int? YearsOfExperience { get; set; }

        /// <summary>
        /// S3 URL for the resume file
        /// </summary>
        public string? S3Url { get; set; }

        /// <summary>
        /// Error message if analysis failed
        /// </summary>
        public string? AnalysisError { get; set; }

        // ATS Scoring fields
        /// <summary>
        /// Overall ATS compatibility score (0-100)
        /// </summary>
        [Range(0, 100)]
        public int? AtsOverallScore { get; set; }

        /// <summary>
        /// ATS formatting score (0-100)
        /// </summary>
        [Range(0, 100)]
        public int? AtsFormattingScore { get; set; }

        /// <summary>
        /// ATS keywords score (0-100)
        /// </summary>
        [Range(0, 100)]
        public int? AtsKeywordsScore { get; set; }

        /// <summary>
        /// ATS experience score (0-100)
        /// </summary>
        [Range(0, 100)]
        public int? AtsExperienceScore { get; set; }

        /// <summary>
        /// ATS education score (0-100)
        /// </summary>
        [Range(0, 100)]
        public int? AtsEducationScore { get; set; }

        /// <summary>
        /// ATS skills score (0-100)
        /// </summary>
        [Range(0, 100)]
        public int? AtsSkillsScore { get; set; }

        /// <summary>
        /// ATS achievements score (0-100)
        /// </summary>
        [Range(0, 100)]
        public int? AtsAchievementsScore { get; set; }

        // Parsed array fields - these are the main fields that were causing the JavaScript errors
        /// <summary>
        /// List of resume strengths (parsed from JSON string)
        /// </summary>
        public List<string> Strengths { get; set; } = new();

        /// <summary>
        /// List of resume weaknesses (parsed from JSON string)
        /// </summary>
        public List<string> Weaknesses { get; set; } = new();

        /// <summary>
        /// List of improvement recommendations (parsed from JSON string)
        /// </summary>
        public List<string> Recommendations { get; set; } = new();

        /// <summary>
        /// List of keywords found in the resume (parsed from JSON string)
        /// </summary>
        public List<string> KeywordsFound { get; set; } = new();

        /// <summary>
        /// List of keywords missing from the resume (parsed from JSON string)
        /// </summary>
        public List<string> KeywordsMissing { get; set; } = new();

        /// <summary>
        /// List of readability issues (parsed from JSON string)
        /// </summary>
        public List<string> ReadabilityIssues { get; set; } = new();

        // Parsed object field
        /// <summary>
        /// Section-by-section feedback (parsed from JSON string)
        /// </summary>
        public Dictionary<string, object> SectionFeedback { get; set; } = new();

        // Other scalar properties from the original model
        /// <summary>
        /// Keyword density percentage
        /// </summary>
        [Range(0, 100)]
        public int? KeywordDensity { get; set; }

        /// <summary>
        /// Readability score (0-100)
        /// </summary>
        [Range(0, 100)]
        public int? ReadabilityScore { get; set; }

        /// <summary>
        /// Date and time when the analysis was processed
        /// </summary>
        public DateTime ProcessedAt { get; set; }

        /// <summary>
        /// Date and time when the analysis record was created
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// Date and time when the analysis record was last updated
        /// </summary>
        public DateTime UpdatedAt { get; set; }
    }
}
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireThemNoW.Server.Models
{
    [Table("resume_analyses")]
    public class ResumeAnalysis
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("user_id")]
        public string UserId { get; set; } = string.Empty;

        [Column("resume_url")]
        public string? ResumeUrl { get; set; }

        [Column("technical_skills")]
        public string? TechnicalSkills { get; set; }

        [Column("soft_skills")]
        public string? SoftSkills { get; set; }

        [Column("programming_languages")]
        public string? ProgrammingLanguages { get; set; }

        [Column("tools")]
        public string? Tools { get; set; }

        [Column("experience_summary")]
        public string? ExperienceSummary { get; set; }

        [Column("education")]
        public string? Education { get; set; }

        [Column("certifications")]
        public string? Certifications { get; set; }

        [Column("summary")]
        public string? Summary { get; set; }

        [Column("years_of_experience")]
        public int? YearsOfExperience { get; set; }

        [Column("s3_url")]
        public string? S3Url { get; set; }

        // ATS Scoring fields
        [Column("ats_overall_score")]
        public int? AtsOverallScore { get; set; }

        [Column("ats_formatting_score")]
        public int? AtsFormattingScore { get; set; }

        [Column("ats_keywords_score")]
        public int? AtsKeywordsScore { get; set; }

        [Column("ats_experience_score")]
        public int? AtsExperienceScore { get; set; }

        [Column("ats_education_score")]
        public int? AtsEducationScore { get; set; }

        [Column("ats_skills_score")]
        public int? AtsSkillsScore { get; set; }

        [Column("ats_achievements_score")]
        public int? AtsAchievementsScore { get; set; }

        [Column("strengths")]
        public string? Strengths { get; set; }  // JSON array

        [Column("weaknesses")]
        public string? Weaknesses { get; set; }  // JSON array

        [Column("improvements")]
        public string? Improvements { get; set; }  // JSON array

        [Column("keywords_found")]
        public string? KeywordsFound { get; set; }  // JSON array

        [Column("keywords_missing")]
        public string? KeywordsMissing { get; set; }  // JSON array

        [Column("keyword_density")]
        public int? KeywordDensity { get; set; }

        [Column("readability_score")]
        public int? ReadabilityScore { get; set; }

        [Column("readability_issues")]
        public string? ReadabilityIssues { get; set; }  // JSON array

        [Column("recommendations")]
        public string? Recommendations { get; set; }  // JSON array

        [Column("processed_at")]
        public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;

namespace HireThemNoW.Server.Models
{
    /// <summary>
    /// DTO representing the result of an ATS (Applicant Tracking System) analysis from Bedrock
    /// </summary>
    public class AtsAnalysisResult
    {
        // Individual section scores (0-100)
        [Range(0, 100)]
        public int FormattingScore { get; set; }

        [Range(0, 100)]
        public int KeywordsScore { get; set; }

        [Range(0, 100)]
        public int ExperienceScore { get; set; }

        [Range(0, 100)]
        public int EducationScore { get; set; }

        [Range(0, 100)]
        public int SkillsScore { get; set; }

        [Range(0, 100)]
        public int AchievementsScore { get; set; }

        [Range(0, 100)]
        public int ReadabilityScore { get; set; }

        // Feedback arrays
        public List<string> Strengths { get; set; } = new();
        public List<string> Weaknesses { get; set; } = new();
        public List<string> Recommendations { get; set; } = new();

        // Keyword analysis fields
        public List<string> KeywordsFound { get; set; } = new();
        public List<string> KeywordsMissing { get; set; } = new();

        [Range(0, 100)]
        public int KeywordDensity { get; set; }

        // Readability analysis
        public List<string> ReadabilityIssues { get; set; } = new();

        // Section-by-section feedback
        public Dictionary<string, SectionFeedback> SectionFeedback { get; set; } = new();
    }
}
using HireThemNoW.Server.Models;

namespace HireThemNoW.Server.Services
{
    public interface IBedrockAgentService
    {
        Task<ResumeAnalysisResult> AnalyzeResumeAsync(string userId);
        Task StoreResumeAnalysisAsync(ResumeAnalysisData data);
        Task<ResumeAnalysisResult?> GetLatestAnalysisAsync(string userId);
    }

    public class ResumeAnalysisResult
    {
        public string UserId { get; set; } = string.Empty;
        public PersonalInfo? PersonalInfo { get; set; }
        public SkillsData? Skills { get; set; }
        public List<ExperienceData>? Experience { get; set; }
        public List<EducationData>? Education { get; set; }
        public List<string>? Certifications { get; set; }
        public string? Summary { get; set; }
        public ATSScore? AtsScore { get; set; }
        public List<string>? Strengths { get; set; }
        public List<string>? Weaknesses { get; set; }
        public List<ImprovementSuggestion>? Improvements { get; set; }
        public KeywordAnalysis? Keywords { get; set; }
        public ReadabilityScore? Readability { get; set; }
        public List<string>? Recommendations { get; set; }
        public string? S3Url { get; set; }
        public DateTime ProcessedAt { get; set; }
    }

    public class ATSScore
    {
        public int Overall { get; set; }
        public ScoreBreakdown? Breakdown { get; set; }
    }

    public class ScoreBreakdown
    {
        public int Formatting { get; set; }
        public int Keywords { get; set; }
        public int Experience { get; set; }
        public int Education { get; set; }
        public int Skills { get; set; }
        public int Achievements { get; set; }
    }

    public class ImprovementSuggestion
    {
        public string Category { get; set; } = string.Empty;
        public string Issue { get; set; } = string.Empty;
        public string Suggestion { get; set; } = string.Empty;
        public string Impact { get; set; } = "medium";
        public int Priority { get; set; }
    }

    public class KeywordAnalysis
    {
        public List<string> Found { get; set; } = new();
        public List<string> Missing { get; set; } = new();
        public int Density { get; set; }
    }

    public class ReadabilityScore
    {
        public int Score { get; set; }
        public List<string> Issues { get; set; } = new();
    }

    public class PersonalInfo
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Location { get; set; }
    }

    public class SkillsData
    {
        public List<string> Technical { get; set; } = new();
        public List<string> Soft { get; set; } = new();
        public List<string> Languages { get; set; } = new();
        public List<string> Tools { get; set; } = new();
    }

    public class ExperienceData
    {
        public string? Title { get; set; }
        public string? Company { get; set; }
        public string? Duration { get; set; }
        public string? Description { get; set; }
        public List<string> Achievements { get; set; } = new();
    }

    public class EducationData
    {
        public string? Degree { get; set; }
        public string? Institution { get; set; }
        public string? Year { get; set; }
        public string? Gpa { get; set; }
    }

    public class ResumeAnalysisData
    {
        public string? UserId { get; set; }
        public PersonalInfo? PersonalInfo { get; set; }
        public SkillsData? Skills { get; set; }
        public List<ExperienceData>? Experience { get; set; }
        public List<EducationData>? Education { get; set; }
        public List<string>? Certifications { get; set; }
        public string? Summary { get; set; }
        public ATSScore? AtsScore { get; set; }
        public List<string>? Strengths { get; set; }
        public List<string>? Weaknesses { get; set; }
        public List<ImprovementSuggestion>? Improvements { get; set; }
        public KeywordAnalysis? Keywords { get; set; }
        public ReadabilityScore? Readability { get; set; }
        public List<string>? Recommendations { get; set; }
        public string? S3Url { get; set; }
        public string? ProcessedAt { get; set; }
        public string? Filename { get; set; }
    }
}

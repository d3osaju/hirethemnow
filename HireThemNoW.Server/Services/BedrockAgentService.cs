using HireThemNoW.Server.Data;
using HireThemNoW.Server.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace HireThemNoW.Server.Services
{
    public class BedrockAgentService : IBedrockAgentService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BedrockAgentService> _logger;

        public BedrockAgentService(
            ApplicationDbContext context,
            ILogger<BedrockAgentService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ResumeAnalysisResult> AnalyzeResumeAsync(string userId)
        {
            _logger.LogInformation("Fetching latest resume analysis for user {UserId}", userId);

            var analysis = await _context.ResumeAnalyses
                .Where(ra => ra.UserId == userId)
                .OrderByDescending(ra => ra.ProcessedAt)
                .FirstOrDefaultAsync();

            if (analysis == null)
            {
                throw new InvalidOperationException($"No resume analysis found for user {userId}");
            }

            return MapToResult(analysis);
        }

        public async Task<ResumeAnalysisResult?> GetLatestAnalysisAsync(string userId)
        {
            var analysis = await _context.ResumeAnalyses
                .Where(ra => ra.UserId == userId)
                .OrderByDescending(ra => ra.ProcessedAt)
                .FirstOrDefaultAsync();

            return analysis != null ? MapToResult(analysis) : null;
        }

        public async Task StoreResumeAnalysisAsync(ResumeAnalysisData data)
        {
            _logger.LogInformation("Storing ATS analysis for user {UserId}", data.UserId);

            try
            {
                var analysis = new ResumeAnalysis
                {
                    UserId = data.UserId ?? string.Empty,
                    ResumeUrl = data.S3Url,
                    TechnicalSkills = JsonSerializer.Serialize(data.Skills?.Technical ?? new List<string>()),
                    SoftSkills = JsonSerializer.Serialize(data.Skills?.Soft ?? new List<string>()),
                    ProgrammingLanguages = JsonSerializer.Serialize(data.Skills?.Languages ?? new List<string>()),
                    Tools = JsonSerializer.Serialize(data.Skills?.Tools ?? new List<string>()),
                    ExperienceSummary = JsonSerializer.Serialize(data.Experience ?? new List<ExperienceData>()),
                    Education = JsonSerializer.Serialize(data.Education ?? new List<EducationData>()),
                    Certifications = JsonSerializer.Serialize(data.Certifications ?? new List<string>()),
                    Summary = data.Summary,
                    S3Url = data.S3Url,

                    // ATS Scoring
                    AtsOverallScore = data.AtsScore?.Overall,
                    AtsFormattingScore = data.AtsScore?.Breakdown?.Formatting,
                    AtsKeywordsScore = data.AtsScore?.Breakdown?.Keywords,
                    AtsExperienceScore = data.AtsScore?.Breakdown?.Experience,
                    AtsEducationScore = data.AtsScore?.Breakdown?.Education,
                    AtsSkillsScore = data.AtsScore?.Breakdown?.Skills,
                    AtsAchievementsScore = data.AtsScore?.Breakdown?.Achievements,

                    Strengths = JsonSerializer.Serialize(data.Strengths ?? new List<string>()),
                    Weaknesses = JsonSerializer.Serialize(data.Weaknesses ?? new List<string>()),
                    Improvements = JsonSerializer.Serialize(data.Improvements ?? new List<ImprovementSuggestion>()),

                    KeywordsFound = JsonSerializer.Serialize(data.Keywords?.Found ?? new List<string>()),
                    KeywordsMissing = JsonSerializer.Serialize(data.Keywords?.Missing ?? new List<string>()),
                    KeywordDensity = data.Keywords?.Density,

                    ReadabilityScore = data.Readability?.Score,
                    ReadabilityIssues = JsonSerializer.Serialize(data.Readability?.Issues ?? new List<string>()),

                    Recommendations = JsonSerializer.Serialize(data.Recommendations ?? new List<string>()),
                    ProcessedAt = string.IsNullOrEmpty(data.ProcessedAt) ? DateTime.UtcNow : DateTime.Parse(data.ProcessedAt),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.ResumeAnalyses.Add(analysis);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully stored resume analysis for user {UserId}", data.UserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error storing resume analysis for user {UserId}", data.UserId);
                throw;
            }
        }

        private ResumeAnalysisResult MapToResult(ResumeAnalysis analysis)
        {
            return new ResumeAnalysisResult
            {
                UserId = analysis.UserId,
                Skills = new SkillsData
                {
                    Technical = DeserializeList(analysis.TechnicalSkills),
                    Soft = DeserializeList(analysis.SoftSkills),
                    Languages = DeserializeList(analysis.ProgrammingLanguages),
                    Tools = DeserializeList(analysis.Tools)
                },
                Experience = JsonSerializer.Deserialize<List<ExperienceData>>(analysis.ExperienceSummary ?? "[]"),
                Education = JsonSerializer.Deserialize<List<EducationData>>(analysis.Education ?? "[]"),
                Certifications = DeserializeList(analysis.Certifications),
                Summary = analysis.Summary,
                AtsScore = new ATSScore
                {
                    Overall = analysis.AtsOverallScore ?? 0,
                    Breakdown = new ScoreBreakdown
                    {
                        Formatting = analysis.AtsFormattingScore ?? 0,
                        Keywords = analysis.AtsKeywordsScore ?? 0,
                        Experience = analysis.AtsExperienceScore ?? 0,
                        Education = analysis.AtsEducationScore ?? 0,
                        Skills = analysis.AtsSkillsScore ?? 0,
                        Achievements = analysis.AtsAchievementsScore ?? 0
                    }
                },
                Strengths = DeserializeList(analysis.Strengths),
                Weaknesses = DeserializeList(analysis.Weaknesses),
                Improvements = JsonSerializer.Deserialize<List<ImprovementSuggestion>>(analysis.Improvements ?? "[]"),
                Keywords = new KeywordAnalysis
                {
                    Found = DeserializeList(analysis.KeywordsFound),
                    Missing = DeserializeList(analysis.KeywordsMissing),
                    Density = analysis.KeywordDensity ?? 0
                },
                Readability = new ReadabilityScore
                {
                    Score = analysis.ReadabilityScore ?? 0,
                    Issues = DeserializeList(analysis.ReadabilityIssues)
                },
                Recommendations = DeserializeList(analysis.Recommendations),
                S3Url = analysis.S3Url,
                ProcessedAt = analysis.ProcessedAt
            };
        }

        private List<string> DeserializeList(string? json)
        {
            if (string.IsNullOrEmpty(json)) return new List<string>();
            return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
        }
    }
}

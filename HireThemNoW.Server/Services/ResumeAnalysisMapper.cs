using HireThemNoW.Server.Models;

namespace HireThemNoW.Server.Services;

/// <summary>
/// Static mapper class for converting ResumeAnalysis entity to ResumeAnalysisResultDto.
/// Handles JSON string parsing and type conversion for API responses.
/// </summary>
public static class ResumeAnalysisMapper
{
    /// <summary>
    /// Converts a ResumeAnalysis entity to a ResumeAnalysisResultDto with properly parsed JSON fields.
    /// </summary>
    /// <param name="entity">The ResumeAnalysis entity to convert</param>
    /// <param name="logger">Optional logger for error logging during JSON parsing</param>
    /// <returns>A ResumeAnalysisResultDto with parsed array and object fields</returns>
    public static ResumeAnalysisResultDto ToResultDto(ResumeAnalysis entity, ILogger? logger = null)
    {
        return new ResumeAnalysisResultDto
        {
            // Scalar properties - direct mapping
            Id = entity.Id,
            UserId = entity.UserId,
            ResumeContentId = entity.ResumeContentId,
            Status = entity.Status,
            ResumeUrl = entity.ResumeUrl,
            PersonalInfo = entity.PersonalInfo,
            TechnicalSkills = entity.TechnicalSkills,
            SoftSkills = entity.SoftSkills,
            ProgrammingLanguages = entity.ProgrammingLanguages,
            Tools = entity.Tools,
            ExperienceSummary = entity.ExperienceSummary,
            Education = entity.Education,
            Certifications = entity.Certifications,
            Summary = entity.Summary,
            YearsOfExperience = entity.YearsOfExperience,
            S3Url = entity.S3Url,
            AnalysisError = entity.AnalysisError,
            
            // ATS scoring fields - direct mapping
            AtsOverallScore = entity.AtsOverallScore,
            AtsFormattingScore = entity.AtsFormattingScore,
            AtsKeywordsScore = entity.AtsKeywordsScore,
            AtsExperienceScore = entity.AtsExperienceScore,
            AtsEducationScore = entity.AtsEducationScore,
            AtsSkillsScore = entity.AtsSkillsScore,
            AtsAchievementsScore = entity.AtsAchievementsScore,
            
            // Other scalar properties
            KeywordDensity = entity.KeywordDensity,
            ReadabilityScore = entity.ReadabilityScore,
            ProcessedAt = entity.ProcessedAt,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
            
            // JSON string fields parsed to arrays using JsonParsingHelper
            Strengths = JsonParsingHelper.ParseStringArray(entity.Strengths, logger),
            Weaknesses = JsonParsingHelper.ParseStringArray(entity.Weaknesses, logger),
            Recommendations = JsonParsingHelper.ParseStringArray(entity.Recommendations, logger),
            KeywordsFound = JsonParsingHelper.ParseStringArray(entity.KeywordsFound, logger),
            KeywordsMissing = JsonParsingHelper.ParseStringArray(entity.KeywordsMissing, logger),
            ReadabilityIssues = JsonParsingHelper.ParseStringArray(entity.ReadabilityIssues, logger),
            
            // JSON string field parsed to object using JsonParsingHelper
            SectionFeedback = JsonParsingHelper.ParseJsonObject(entity.SectionFeedback, logger)
        };
    }
}
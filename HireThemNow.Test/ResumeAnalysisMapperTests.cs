using FluentAssertions;
using HireThemNoW.Server.Models;
using HireThemNoW.Server.Services;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace HireThemNow.Test;

/// <summary>
/// Unit tests for ResumeAnalysisMapper to verify entity to DTO conversion
/// </summary>
public class ResumeAnalysisMapperTests
{
    private readonly Mock<ILogger> _mockLogger;

    public ResumeAnalysisMapperTests()
    {
        _mockLogger = new Mock<ILogger>();
    }

    [Fact]
    public void ToResultDto_ValidEntityWithJsonStrings_ShouldReturnParsedDto()
    {
        // Arrange
        var entity = new ResumeAnalysis
        {
            Id = 1,
            UserId = "test-user-id",
            Status = "completed",
            AtsOverallScore = 85,
            AtsFormattingScore = 90,
            AtsKeywordsScore = 80,
            AtsExperienceScore = 85,
            AtsEducationScore = 90,
            AtsSkillsScore = 85,
            AtsAchievementsScore = 80,
            Strengths = "[\"Strong technical skills\", \"Clear formatting\"]",
            Weaknesses = "[\"Missing keywords\", \"Limited experience\"]",
            Recommendations = "[\"Add more keywords\", \"Quantify achievements\"]",
            KeywordsFound = "[\"JavaScript\", \"React\", \"Node.js\"]",
            KeywordsMissing = "[\"TypeScript\", \"AWS\", \"Docker\"]",
            ReadabilityIssues = "[\"Long sentences\", \"Complex words\"]",
            SectionFeedback = "{\"personalInfo\": {\"score\": 95, \"issues\": [], \"suggestions\": [\"Add LinkedIn\"]}}",
            KeywordDensity = 75,
            ReadabilityScore = 85,
            ProcessedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow.AddMinutes(-10),
            UpdatedAt = DateTime.UtcNow
        };

        // Act
        var result = ResumeAnalysisMapper.ToResultDto(entity, _mockLogger.Object);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(1);
        result.UserId.Should().Be("test-user-id");
        result.Status.Should().Be("completed");
        result.AtsOverallScore.Should().Be(85);

        // Verify parsed arrays
        result.Strengths.Should().HaveCount(2);
        result.Strengths.Should().Contain("Strong technical skills");
        result.Strengths.Should().Contain("Clear formatting");

        result.Weaknesses.Should().HaveCount(2);
        result.Weaknesses.Should().Contain("Missing keywords");
        result.Weaknesses.Should().Contain("Limited experience");

        result.Recommendations.Should().HaveCount(2);
        result.Recommendations.Should().Contain("Add more keywords");
        result.Recommendations.Should().Contain("Quantify achievements");

        result.KeywordsFound.Should().HaveCount(3);
        result.KeywordsFound.Should().Contain("JavaScript");
        result.KeywordsFound.Should().Contain("React");
        result.KeywordsFound.Should().Contain("Node.js");

        result.KeywordsMissing.Should().HaveCount(3);
        result.KeywordsMissing.Should().Contain("TypeScript");
        result.KeywordsMissing.Should().Contain("AWS");
        result.KeywordsMissing.Should().Contain("Docker");

        result.ReadabilityIssues.Should().HaveCount(2);
        result.ReadabilityIssues.Should().Contain("Long sentences");
        result.ReadabilityIssues.Should().Contain("Complex words");

        // Verify parsed object
        result.SectionFeedback.Should().NotBeNull();
        result.SectionFeedback.Should().ContainKey("personalInfo");
    }

    [Fact]
    public void ToResultDto_EntityWithNullJsonFields_ShouldReturnEmptyArraysAndObjects()
    {
        // Arrange
        var entity = new ResumeAnalysis
        {
            Id = 2,
            UserId = "test-user-id-2",
            Status = "completed",
            AtsOverallScore = 75,
            Strengths = null,
            Weaknesses = null,
            Recommendations = null,
            KeywordsFound = null,
            KeywordsMissing = null,
            ReadabilityIssues = null,
            SectionFeedback = null,
            ProcessedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow.AddMinutes(-5),
            UpdatedAt = DateTime.UtcNow
        };

        // Act
        var result = ResumeAnalysisMapper.ToResultDto(entity, _mockLogger.Object);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(2);
        result.UserId.Should().Be("test-user-id-2");
        result.Status.Should().Be("completed");
        result.AtsOverallScore.Should().Be(75);

        // Verify empty arrays for null inputs
        result.Strengths.Should().NotBeNull();
        result.Strengths.Should().BeEmpty();
        result.Weaknesses.Should().NotBeNull();
        result.Weaknesses.Should().BeEmpty();
        result.Recommendations.Should().NotBeNull();
        result.Recommendations.Should().BeEmpty();
        result.KeywordsFound.Should().NotBeNull();
        result.KeywordsFound.Should().BeEmpty();
        result.KeywordsMissing.Should().NotBeNull();
        result.KeywordsMissing.Should().BeEmpty();
        result.ReadabilityIssues.Should().NotBeNull();
        result.ReadabilityIssues.Should().BeEmpty();

        // Verify empty object for null input
        result.SectionFeedback.Should().NotBeNull();
        result.SectionFeedback.Should().BeEmpty();
    }

    [Fact]
    public void ToResultDto_EntityWithEmptyJsonFields_ShouldReturnEmptyArraysAndObjects()
    {
        // Arrange
        var entity = new ResumeAnalysis
        {
            Id = 3,
            UserId = "test-user-id-3",
            Status = "completed",
            AtsOverallScore = 65,
            Strengths = "",
            Weaknesses = "   ",
            Recommendations = "[]",
            KeywordsFound = "[]",
            KeywordsMissing = "",
            ReadabilityIssues = "   ",
            SectionFeedback = "{}",
            ProcessedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow.AddMinutes(-3),
            UpdatedAt = DateTime.UtcNow
        };

        // Act
        var result = ResumeAnalysisMapper.ToResultDto(entity, _mockLogger.Object);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(3);
        result.UserId.Should().Be("test-user-id-3");
        result.Status.Should().Be("completed");
        result.AtsOverallScore.Should().Be(65);

        // Verify empty arrays for empty/whitespace inputs
        result.Strengths.Should().NotBeNull();
        result.Strengths.Should().BeEmpty();
        result.Weaknesses.Should().NotBeNull();
        result.Weaknesses.Should().BeEmpty();
        result.Recommendations.Should().NotBeNull();
        result.Recommendations.Should().BeEmpty();
        result.KeywordsFound.Should().NotBeNull();
        result.KeywordsFound.Should().BeEmpty();
        result.KeywordsMissing.Should().NotBeNull();
        result.KeywordsMissing.Should().BeEmpty();
        result.ReadabilityIssues.Should().NotBeNull();
        result.ReadabilityIssues.Should().BeEmpty();

        // Verify empty object for empty JSON input
        result.SectionFeedback.Should().NotBeNull();
        result.SectionFeedback.Should().BeEmpty();
    }

    [Fact]
    public void ToResultDto_EntityWithInvalidJsonFields_ShouldReturnEmptyArraysAndObjectsAndLog()
    {
        // Arrange
        var entity = new ResumeAnalysis
        {
            Id = 4,
            UserId = "test-user-id-4",
            Status = "completed",
            AtsOverallScore = 55,
            Strengths = "invalid json",
            Weaknesses = "[\"item1\", \"item2\"", // Missing closing bracket
            Recommendations = "{\"not\": \"an array\"}",
            KeywordsFound = "not json at all",
            KeywordsMissing = "[malformed",
            ReadabilityIssues = "plain text",
            SectionFeedback = "not an object",
            ProcessedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow.AddMinutes(-1),
            UpdatedAt = DateTime.UtcNow
        };

        // Act
        var result = ResumeAnalysisMapper.ToResultDto(entity, _mockLogger.Object);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(4);
        result.UserId.Should().Be("test-user-id-4");
        result.Status.Should().Be("completed");
        result.AtsOverallScore.Should().Be(55);

        // Verify empty arrays for invalid JSON inputs
        result.Strengths.Should().NotBeNull();
        result.Strengths.Should().BeEmpty();
        result.Weaknesses.Should().NotBeNull();
        result.Weaknesses.Should().BeEmpty();
        result.Recommendations.Should().NotBeNull();
        result.Recommendations.Should().BeEmpty();
        result.KeywordsFound.Should().NotBeNull();
        result.KeywordsFound.Should().BeEmpty();
        result.KeywordsMissing.Should().NotBeNull();
        result.KeywordsMissing.Should().BeEmpty();
        result.ReadabilityIssues.Should().NotBeNull();
        result.ReadabilityIssues.Should().BeEmpty();

        // Verify empty object for invalid JSON input
        result.SectionFeedback.Should().NotBeNull();
        result.SectionFeedback.Should().BeEmpty();
    }

    [Fact]
    public void ToResultDto_EntityWithMixedValidAndInvalidJson_ShouldHandleEachFieldIndependently()
    {
        // Arrange
        var entity = new ResumeAnalysis
        {
            Id = 5,
            UserId = "test-user-id-5",
            Status = "completed",
            AtsOverallScore = 70,
            Strengths = "[\"Valid strength\"]", // Valid
            Weaknesses = "invalid json", // Invalid
            Recommendations = "[\"Valid recommendation\"]", // Valid
            KeywordsFound = "not json", // Invalid
            KeywordsMissing = "[\"Missing keyword\"]", // Valid
            ReadabilityIssues = "plain text", // Invalid
            SectionFeedback = "{\"section1\": {\"score\": 80}}", // Valid
            ProcessedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow.AddMinutes(-2),
            UpdatedAt = DateTime.UtcNow
        };

        // Act
        var result = ResumeAnalysisMapper.ToResultDto(entity, _mockLogger.Object);

        // Assert
        result.Should().NotBeNull();

        // Valid JSON should be parsed correctly
        result.Strengths.Should().HaveCount(1);
        result.Strengths.Should().Contain("Valid strength");

        result.Recommendations.Should().HaveCount(1);
        result.Recommendations.Should().Contain("Valid recommendation");

        result.KeywordsMissing.Should().HaveCount(1);
        result.KeywordsMissing.Should().Contain("Missing keyword");

        result.SectionFeedback.Should().ContainKey("section1");

        // Invalid JSON should result in empty collections
        result.Weaknesses.Should().BeEmpty();
        result.KeywordsFound.Should().BeEmpty();
        result.ReadabilityIssues.Should().BeEmpty();
    }

    [Fact]
    public void ToResultDto_EntityWithComplexSectionFeedback_ShouldParseCorrectly()
    {
        // Arrange
        var complexSectionFeedback = @"{
            ""personalInfo"": {
                ""score"": 95,
                ""issues"": [],
                ""suggestions"": [""Add LinkedIn profile""]
            },
            ""experience"": {
                ""score"": 85,
                ""issues"": [""Missing quantifiable achievements""],
                ""suggestions"": [""Add specific metrics"", ""Use action verbs""]
            },
            ""skills"": {
                ""score"": 75,
                ""issues"": [""Limited technical skills""],
                ""suggestions"": [""Add more programming languages""]
            }
        }";

        var entity = new ResumeAnalysis
        {
            Id = 6,
            UserId = "test-user-id-6",
            Status = "completed",
            SectionFeedback = complexSectionFeedback,
            ProcessedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Act
        var result = ResumeAnalysisMapper.ToResultDto(entity, _mockLogger.Object);

        // Assert
        result.Should().NotBeNull();
        result.SectionFeedback.Should().NotBeNull();
        result.SectionFeedback.Should().HaveCount(3);
        result.SectionFeedback.Should().ContainKey("personalInfo");
        result.SectionFeedback.Should().ContainKey("experience");
        result.SectionFeedback.Should().ContainKey("skills");
    }

    [Fact]
    public void ToResultDto_AllScalarProperties_ShouldBeMappedCorrectly()
    {
        // Arrange
        var testDate = DateTime.UtcNow;
        var entity = new ResumeAnalysis
        {
            Id = 7,
            UserId = "test-user-id-7",
            ResumeContentId = 123,
            Status = "completed",
            ResumeUrl = "test-resume-url",
            PersonalInfo = "test-personal-info",
            TechnicalSkills = "test-technical-skills",
            SoftSkills = "test-soft-skills",
            ProgrammingLanguages = "test-programming-languages",
            Tools = "test-tools",
            ExperienceSummary = "test-experience-summary",
            Education = "test-education",
            Certifications = "test-certifications",
            Summary = "test-summary",
            YearsOfExperience = 5,
            S3Url = "test-s3-url",
            AnalysisError = null,
            AtsOverallScore = 88,
            AtsFormattingScore = 92,
            AtsKeywordsScore = 85,
            AtsExperienceScore = 87,
            AtsEducationScore = 90,
            AtsSkillsScore = 83,
            AtsAchievementsScore = 86,
            KeywordDensity = 78,
            ReadabilityScore = 82,
            ProcessedAt = testDate,
            CreatedAt = testDate.AddMinutes(-10),
            UpdatedAt = testDate.AddMinutes(-1),
            // Set JSON fields to empty to focus on scalar properties
            Strengths = "[]",
            Weaknesses = "[]",
            Recommendations = "[]",
            KeywordsFound = "[]",
            KeywordsMissing = "[]",
            ReadabilityIssues = "[]",
            SectionFeedback = "{}"
        };

        // Act
        var result = ResumeAnalysisMapper.ToResultDto(entity, _mockLogger.Object);

        // Assert - Verify all scalar properties are mapped correctly
        result.Should().NotBeNull();
        result.Id.Should().Be(7);
        result.UserId.Should().Be("test-user-id-7");
        result.ResumeContentId.Should().Be(123);
        result.Status.Should().Be("completed");
        result.ResumeUrl.Should().Be("test-resume-url");
        result.PersonalInfo.Should().Be("test-personal-info");
        result.TechnicalSkills.Should().Be("test-technical-skills");
        result.SoftSkills.Should().Be("test-soft-skills");
        result.ProgrammingLanguages.Should().Be("test-programming-languages");
        result.Tools.Should().Be("test-tools");
        result.ExperienceSummary.Should().Be("test-experience-summary");
        result.Education.Should().Be("test-education");
        result.Certifications.Should().Be("test-certifications");
        result.Summary.Should().Be("test-summary");
        result.YearsOfExperience.Should().Be(5);
        result.S3Url.Should().Be("test-s3-url");
        result.AnalysisError.Should().BeNull();
        result.AtsOverallScore.Should().Be(88);
        result.AtsFormattingScore.Should().Be(92);
        result.AtsKeywordsScore.Should().Be(85);
        result.AtsExperienceScore.Should().Be(87);
        result.AtsEducationScore.Should().Be(90);
        result.AtsSkillsScore.Should().Be(83);
        result.AtsAchievementsScore.Should().Be(86);
        result.KeywordDensity.Should().Be(78);
        result.ReadabilityScore.Should().Be(82);
        result.ProcessedAt.Should().Be(testDate);
        result.CreatedAt.Should().Be(testDate.AddMinutes(-10));
        result.UpdatedAt.Should().Be(testDate.AddMinutes(-1));
    }
}
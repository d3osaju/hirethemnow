using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using HireThemNoW.Server.Models;
using HireThemNoW.Server.Services;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HireThemNow.Test;

/// <summary>
/// End-to-end integration tests for the resume analysis JSON parsing fix
/// Tests the complete flow from API endpoints to frontend data consumption
/// </summary>
public class ResumeAnalysisEndToEndTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactory<Program> _factory;

    public ResumeAnalysisEndToEndTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> GetAuthTokenAsync()
    {
        // Register a test user
        var registerData = new
        {
            name = "Test User",
            email = $"test_{Guid.NewGuid()}@example.com",
            password = "Test123!@#",
            role = "candidate"
        };

        var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", registerData);
        registerResponse.EnsureSuccessStatusCode();

        var result = await registerResponse.Content.ReadFromJsonAsync<JsonElement>();
        return result.GetProperty("data").GetProperty("token").GetString()!;
    }

    private async Task<ResumeAnalysis> CreateTestAnalysisWithJsonStrings(string userId)
    {
        using var scope = _factory.Services.CreateScope();
        var dataService = scope.ServiceProvider.GetRequiredService<IDataService>();

        // Create a test analysis with JSON string fields (simulating existing database data)
        var analysis = new ResumeAnalysis
        {
            UserId = userId,
            Status = "completed",
            AtsOverallScore = 85,
            AtsFormattingScore = 90,
            AtsKeywordsScore = 80,
            AtsExperienceScore = 85,
            AtsEducationScore = 90,
            AtsSkillsScore = 85,
            AtsAchievementsScore = 80,
            
            // These are stored as JSON strings in the database (the original problem)
            Strengths = "[\"Strong technical skills clearly presented\", \"Quantifiable achievements in work experience\", \"Professional formatting and structure\"]",
            Weaknesses = "[\"Missing industry-specific keywords\", \"Limited leadership experience mentioned\", \"Could benefit from more action verbs\"]",
            Recommendations = "[\"Add more industry-specific keywords like 'Agile', 'Scrum', 'CI/CD'\", \"Quantify more achievements with specific numbers and percentages\", \"Use stronger action verbs like 'spearheaded', 'optimized', 'architected'\"]",
            KeywordsFound = "[\"JavaScript\", \"React\", \"Node.js\", \"MongoDB\", \"Git\"]",
            KeywordsMissing = "[\"TypeScript\", \"AWS\", \"Docker\", \"Kubernetes\", \"Agile\"]",
            ReadabilityIssues = "[\"Some sentences are too long (>25 words)\", \"Consider using more bullet points for better readability\"]",
            
            // Complex nested JSON object
            SectionFeedback = @"{
                ""personalInfo"": {
                    ""score"": 95,
                    ""issues"": [],
                    ""suggestions"": [""Consider adding a LinkedIn profile URL""]
                },
                ""summary"": {
                    ""score"": 80,
                    ""issues"": [""Summary could be more concise""],
                    ""suggestions"": [""Focus on top 3-4 key achievements"", ""Add more industry keywords""]
                },
                ""experience"": {
                    ""score"": 85,
                    ""issues"": [""Some achievements lack quantification""],
                    ""suggestions"": [""Add more specific metrics and numbers"", ""Use stronger action verbs""]
                }
            }",
            
            KeywordDensity = 75,
            ReadabilityScore = 85,
            ProcessedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow.AddMinutes(-10),
            UpdatedAt = DateTime.UtcNow
        };

        return await dataService.SaveResumeAnalysisAsync(analysis);
    }

    private async Task<ResumeAnalysis> CreateTestAnalysisWithEdgeCases(string userId)
    {
        using var scope = _factory.Services.CreateScope();
        var dataService = scope.ServiceProvider.GetRequiredService<IDataService>();

        // Create a test analysis with edge case JSON fields
        var analysis = new ResumeAnalysis
        {
            UserId = userId,
            Status = "completed",
            AtsOverallScore = 65,
            
            // Edge cases: null, empty, invalid JSON
            Strengths = null, // Null case
            Weaknesses = "", // Empty string case
            Recommendations = "   ", // Whitespace case
            KeywordsFound = "[]", // Empty array case
            KeywordsMissing = "invalid json string", // Invalid JSON case
            ReadabilityIssues = "[\"item1\", \"item2\"", // Malformed JSON (missing closing bracket)
            SectionFeedback = "{}", // Empty object case
            
            ProcessedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow.AddMinutes(-5),
            UpdatedAt = DateTime.UtcNow
        };

        return await dataService.SaveResumeAnalysisAsync(analysis);
    }

    [Fact]
    public async Task GetAnalysisResults_WithExistingJsonStringData_ShouldReturnParsedArraysAndObjects()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Get user ID from profile
        var profileResponse = await _client.GetAsync("/api/auth/profile");
        var profileResult = await profileResponse.Content.ReadFromJsonAsync<JsonElement>();
        var userId = profileResult.GetProperty("data").GetProperty("id").GetString()!;

        // Create test analysis with JSON strings in database
        await CreateTestAnalysisWithJsonStrings(userId);

        // Act
        var response = await _client.GetAsync("/api/resume/analysis/results");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("success").GetBoolean().Should().BeTrue();
        
        var data = result.GetProperty("data");
        
        // Verify that arrays are returned as actual arrays, not JSON strings
        var strengths = data.GetProperty("strengths");
        strengths.ValueKind.Should().Be(JsonValueKind.Array);
        strengths.GetArrayLength().Should().Be(3);
        strengths[0].GetString().Should().Be("Strong technical skills clearly presented");
        strengths[1].GetString().Should().Be("Quantifiable achievements in work experience");
        strengths[2].GetString().Should().Be("Professional formatting and structure");

        var weaknesses = data.GetProperty("weaknesses");
        weaknesses.ValueKind.Should().Be(JsonValueKind.Array);
        weaknesses.GetArrayLength().Should().Be(3);
        weaknesses[0].GetString().Should().Be("Missing industry-specific keywords");

        var recommendations = data.GetProperty("recommendations");
        recommendations.ValueKind.Should().Be(JsonValueKind.Array);
        recommendations.GetArrayLength().Should().Be(3);
        recommendations[0].GetString().Should().Contain("Agile");

        var keywordsFound = data.GetProperty("keywordsFound");
        keywordsFound.ValueKind.Should().Be(JsonValueKind.Array);
        keywordsFound.GetArrayLength().Should().Be(5);
        keywordsFound[0].GetString().Should().Be("JavaScript");

        var keywordsMissing = data.GetProperty("keywordsMissing");
        keywordsMissing.ValueKind.Should().Be(JsonValueKind.Array);
        keywordsMissing.GetArrayLength().Should().Be(5);
        keywordsMissing[0].GetString().Should().Be("TypeScript");

        var readabilityIssues = data.GetProperty("readabilityIssues");
        readabilityIssues.ValueKind.Should().Be(JsonValueKind.Array);
        readabilityIssues.GetArrayLength().Should().Be(2);

        // Verify that sectionFeedback is returned as an actual object, not JSON string
        var sectionFeedback = data.GetProperty("sectionFeedback");
        sectionFeedback.ValueKind.Should().Be(JsonValueKind.Object);
        sectionFeedback.TryGetProperty("personalInfo", out var personalInfo).Should().BeTrue();
        personalInfo.GetProperty("score").GetInt32().Should().Be(95);
        
        sectionFeedback.TryGetProperty("experience", out var experience).Should().BeTrue();
        experience.GetProperty("score").GetInt32().Should().Be(85);
    }

    [Fact]
    public async Task GetAnalysisResults_WithEdgeCaseJsonData_ShouldHandleGracefully()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Get user ID from profile
        var profileResponse = await _client.GetAsync("/api/auth/profile");
        var profileResult = await profileResponse.Content.ReadFromJsonAsync<JsonElement>();
        var userId = profileResult.GetProperty("data").GetProperty("id").GetString()!;

        // Create test analysis with edge case data
        await CreateTestAnalysisWithEdgeCases(userId);

        // Act
        var response = await _client.GetAsync("/api/resume/analysis/results");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("success").GetBoolean().Should().BeTrue();
        
        var data = result.GetProperty("data");
        
        // Verify that all edge cases result in empty arrays/objects, not errors
        var strengths = data.GetProperty("strengths");
        strengths.ValueKind.Should().Be(JsonValueKind.Array);
        strengths.GetArrayLength().Should().Be(0); // null -> empty array

        var weaknesses = data.GetProperty("weaknesses");
        weaknesses.ValueKind.Should().Be(JsonValueKind.Array);
        weaknesses.GetArrayLength().Should().Be(0); // empty string -> empty array

        var recommendations = data.GetProperty("recommendations");
        recommendations.ValueKind.Should().Be(JsonValueKind.Array);
        recommendations.GetArrayLength().Should().Be(0); // whitespace -> empty array

        var keywordsFound = data.GetProperty("keywordsFound");
        keywordsFound.ValueKind.Should().Be(JsonValueKind.Array);
        keywordsFound.GetArrayLength().Should().Be(0); // empty JSON array -> empty array

        var keywordsMissing = data.GetProperty("keywordsMissing");
        keywordsMissing.ValueKind.Should().Be(JsonValueKind.Array);
        keywordsMissing.GetArrayLength().Should().Be(0); // invalid JSON -> empty array

        var readabilityIssues = data.GetProperty("readabilityIssues");
        readabilityIssues.ValueKind.Should().Be(JsonValueKind.Array);
        readabilityIssues.GetArrayLength().Should().Be(0); // malformed JSON -> empty array

        var sectionFeedback = data.GetProperty("sectionFeedback");
        sectionFeedback.ValueKind.Should().Be(JsonValueKind.Object);
        sectionFeedback.EnumerateObject().Count().Should().Be(0); // empty JSON object -> empty object
    }

    [Fact]
    public async Task GetAnalysisStatus_WithCompletedAnalysis_ShouldReturnCorrectStatus()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Get user ID from profile
        var profileResponse = await _client.GetAsync("/api/auth/profile");
        var profileResult = await profileResponse.Content.ReadFromJsonAsync<JsonElement>();
        var userId = profileResult.GetProperty("data").GetProperty("id").GetString()!;

        // Create test analysis
        await CreateTestAnalysisWithJsonStrings(userId);

        // Act
        var response = await _client.GetAsync("/api/resume/analysis/status");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("success").GetBoolean().Should().BeTrue();
        
        var data = result.GetProperty("data");
        data.GetProperty("status").GetString().Should().Be("completed");
        data.GetProperty("overallScore").GetInt32().Should().Be(85);
        data.TryGetProperty("completedAt", out _).Should().BeTrue();
        data.TryGetProperty("errorMessage", out var errorMessage).Should().BeTrue();
        errorMessage.ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task GetAnalysisResults_NoAnalysisExists_ShouldReturn404()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act - Don't create any analysis data
        var response = await _client.GetAsync("/api/resume/analysis/results");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("success").GetBoolean().Should().BeFalse();
        result.GetProperty("message").GetString().Should().Contain("No resume analysis found");
    }

    [Fact]
    public async Task GetAnalysisResults_ProcessingStatus_ShouldReturn202()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Get user ID from profile
        var profileResponse = await _client.GetAsync("/api/auth/profile");
        var profileResult = await profileResponse.Content.ReadFromJsonAsync<JsonElement>();
        var userId = profileResult.GetProperty("data").GetProperty("id").GetString()!;

        // Create analysis with processing status
        using var scope = _factory.Services.CreateScope();
        var dataService = scope.ServiceProvider.GetRequiredService<IDataService>();
        
        var analysis = new ResumeAnalysis
        {
            UserId = userId,
            Status = "processing", // Still processing
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            ProcessedAt = DateTime.UtcNow
        };
        
        await dataService.SaveResumeAnalysisAsync(analysis);

        // Act
        var response = await _client.GetAsync("/api/resume/analysis/results");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Accepted); // 202
        
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("success").GetBoolean().Should().BeTrue();
        result.GetProperty("message").GetString().Should().Contain("still being analyzed");
        result.TryGetProperty("data", out var data).Should().BeTrue();
        data.ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task GetAnalysisResults_FailedStatus_ShouldReturnErrorDetails()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Get user ID from profile
        var profileResponse = await _client.GetAsync("/api/auth/profile");
        var profileResult = await profileResponse.Content.ReadFromJsonAsync<JsonElement>();
        var userId = profileResult.GetProperty("data").GetProperty("id").GetString()!;

        // Create analysis with failed status
        using var scope = _factory.Services.CreateScope();
        var dataService = scope.ServiceProvider.GetRequiredService<IDataService>();
        
        var analysis = new ResumeAnalysis
        {
            UserId = userId,
            Status = "failed",
            AnalysisError = "Test error message",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            ProcessedAt = DateTime.UtcNow
        };
        
        await dataService.SaveResumeAnalysisAsync(analysis);

        // Act
        var response = await _client.GetAsync("/api/resume/analysis/results");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("success").GetBoolean().Should().BeFalse();
        result.GetProperty("message").GetString().Should().Contain("analysis failed");
        result.TryGetProperty("errors", out var errors).Should().BeTrue();
        errors.ValueKind.Should().Be(JsonValueKind.Array);
        errors.GetArrayLength().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task RetryAnalysis_WithExistingFailedAnalysis_ShouldInitiateRetry()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Get user ID from profile
        var profileResponse = await _client.GetAsync("/api/auth/profile");
        var profileResult = await profileResponse.Content.ReadFromJsonAsync<JsonElement>();
        var userId = profileResult.GetProperty("data").GetProperty("id").GetString()!;

        // Create analysis with failed status
        using var scope = _factory.Services.CreateScope();
        var dataService = scope.ServiceProvider.GetRequiredService<IDataService>();
        
        var analysis = new ResumeAnalysis
        {
            UserId = userId,
            Status = "failed",
            AnalysisError = "Previous error",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            ProcessedAt = DateTime.UtcNow
        };
        
        await dataService.SaveResumeAnalysisAsync(analysis);

        // Act
        var response = await _client.PostAsync("/api/resume/analysis/retry", null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("success").GetBoolean().Should().BeTrue();
        result.GetProperty("message").GetString().Should().Contain("retry initiated");
    }

    [Fact]
    public async Task RetryAnalysis_NoAnalysisExists_ShouldReturn404()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act - Don't create any analysis data
        var response = await _client.PostAsync("/api/resume/analysis/retry", null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("success").GetBoolean().Should().BeFalse();
        result.GetProperty("message").GetString().Should().Contain("No resume analysis found");
    }

    [Fact]
    public async Task AnalysisEndpoints_WithoutAuthentication_ShouldReturn401()
    {
        // Act & Assert - Test all analysis endpoints without authentication
        var endpoints = new[]
        {
            "/api/resume/analysis/status",
            "/api/resume/analysis/results"
        };

        foreach (var endpoint in endpoints)
        {
            var response = await _client.GetAsync(endpoint);
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        // Test retry endpoint
        var retryResponse = await _client.PostAsync("/api/resume/analysis/retry", null);
        retryResponse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
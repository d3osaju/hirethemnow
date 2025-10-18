using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using HireThemNoW.Server.Models;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace HireThemNow.Test;

public class ApiEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private string? _authToken;

    public ApiEndpointsTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<string> GetAuthTokenAsync()
    {
        if (_authToken != null) return _authToken;

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
        _authToken = result.GetProperty("data").GetProperty("token").GetString();

        return _authToken!;
    }

    [Fact]
    public async Task HealthCheck_ShouldReturnSuccess()
    {
        // Act
        var response = await _client.GetAsync("/api/health");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("status");
    }

    [Fact]
    public async Task Auth_Register_ShouldCreateNewUser()
    {
        // Arrange
        var registerData = new
        {
            name = "New User",
            email = $"newuser_{Guid.NewGuid()}@example.com",
            password = "Test123!@#",
            role = "candidate"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", registerData);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("success").GetBoolean().Should().BeTrue();
        result.GetProperty("data").GetProperty("token").GetString().Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Auth_Login_ShouldReturnToken()
    {
        // Arrange - First register
        var email = $"loginuser_{Guid.NewGuid()}@example.com";
        var password = "Test123!@#";

        var registerData = new { name = "Login Test", email, password, role = "candidate" };
        await _client.PostAsJsonAsync("/api/auth/register", registerData);

        var loginData = new { email, password };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginData);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("success").GetBoolean().Should().BeTrue();
        result.GetProperty("data").GetProperty("token").GetString().Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Auth_GetProfile_ShouldReturnUserData()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/auth/profile");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("success").GetBoolean().Should().BeTrue();
        result.GetProperty("data").GetProperty("name").GetString().Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Auth_UpdateProfile_ShouldUpdateUserInfo()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var updateData = new
        {
            name = "Updated Name",
            phone = "+1234567890",
            location = "Test City",
            bio = "Test bio"
        };

        // Act
        var response = await _client.PutAsJsonAsync("/api/auth/profile", updateData);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("success").GetBoolean().Should().BeTrue();
        result.GetProperty("data").GetProperty("name").GetString().Should().Be("Updated Name");
    }

    [Fact]
    public async Task Industries_GetAll_ShouldReturnList()
    {
        // Act
        var response = await _client.GetAsync("/api/industries");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("success").GetBoolean().Should().BeTrue();
    }

    [Fact]
    public async Task EmailPreferences_Get_ShouldReturnPreferences()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/emailpreferences");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("success").GetBoolean().Should().BeTrue();
    }

    [Fact]
    public async Task EmailPreferences_Update_ShouldUpdateSettings()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var updateData = new
        {
            weeklyPerformanceReport = true,
            marketingEmails = false
        };

        // Act
        var response = await _client.PutAsJsonAsync("/api/emailpreferences", updateData);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("success").GetBoolean().Should().BeTrue();
    }

    [Fact]
    public async Task Privacy_Get_ShouldReturnPrivacySettings()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/privacy");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("success").GetBoolean().Should().BeTrue();
        result.GetProperty("data").GetProperty("profileVisibility").GetString().Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Privacy_Update_ShouldUpdatePrivacySettings()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var updateData = new
        {
            profileVisibility = "private",
            allowAnalyticsDataSharing = false
        };

        // Act
        var response = await _client.PutAsJsonAsync("/api/privacy", updateData);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("success").GetBoolean().Should().BeTrue();
        result.GetProperty("data").GetProperty("profileVisibility").GetString().Should().Be("private");
    }

    [Fact]
    public async Task Users_GetMe_ShouldReturnCurrentUser()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/users/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("success").GetBoolean().Should().BeTrue();
    }

    [Fact]
    public async Task JobWebhook_WithWrongSecretToken_ShouldReturnUnauthorized()
    {
        // Arrange
        var jobData = new
        {
            jobTitle = "Software Engineer",
            company = "Test Company",
            location = "Remote",
            isRemote = true,
            link = "https://example.com/job/123",
            secretToken = "wrong-token-value"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/jobwebhook", jobData);
        var responseContent = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("success").GetBoolean().Should().BeFalse();
        result.GetProperty("message").GetString().Should().Contain("authentication");
    }

    [Fact]
    public async Task JobWebhook_WithMissingSecretToken_ShouldReturnBadRequest()
    {
        // Arrange
        var jobData = new
        {
            jobTitle = "Software Engineer",
            company = "Test Company",
            location = "Remote",
            isRemote = true,
            link = "https://example.com/job/456"
            // Missing secretToken - should fail model validation
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/jobwebhook", jobData);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        // This should fail at model validation level due to [Required] attribute
    }

    [Fact]
    public async Task JobWebhookBulk_WithValidData_ShouldReturnOk()
    {
        // Arrange
        var jobDataList = new[]
        {
            new
            {
                jobTitle = "Senior Software Engineer",
                company = "Tech Corp",
                location = "San Francisco, CA",
                emails = "hr@techcorp.com,recruiter@techcorp.com",
                emailType = "summary",
                isRemote = true,
                salary = "$120,000 - $150,000",
                link = "https://techcorp.com/jobs/senior-engineer",
                snippet = "We are looking for a senior software engineer...",
                scrapedDate = "2024-10-18T10:00:00Z",
                secretToken = "development-webhook-secret"
            },
            new
            {
                jobTitle = "Frontend Developer",
                company = "Design Studio",
                location = "New York, NY",
                emails = "jobs@designstudio.com",
                emailType = "detailed",
                isRemote = false,
                salary = "$80,000 - $100,000",
                link = "https://designstudio.com/careers/frontend",
                snippet = "Join our creative team as a frontend developer...",
                scrapedDate = "2024-10-18T11:00:00Z",
                secretToken = "development-webhook-secret"
            }
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/jobwebhook/bulk", jobDataList);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("success").GetBoolean().Should().BeTrue();
        result.GetProperty("data").GetProperty("totalProcessed").GetInt32().Should().Be(2);
        result.GetProperty("data").GetProperty("successCount").GetInt32().Should().Be(2);
        result.GetProperty("data").GetProperty("failureCount").GetInt32().Should().Be(0);
    }

    [Fact]
    public async Task JobWebhookBulk_WithInvalidDataLength_ShouldReturnBadRequest()
    {
        // Arrange - One job has invalid data that fails model validation
        var jobDataList = new[]
        {
            new
            {
                jobTitle = "Valid Job",
                company = "Valid Company",
                location = "Valid Location",
                secretToken = "development-webhook-secret"
            },
            new
            {
                jobTitle = new string('A', 501), // Invalid - exceeds max length of 500
                company = "Invalid Company",
                location = "Invalid Location",
                secretToken = "development-webhook-secret"
            }
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/jobwebhook/bulk", jobDataList);

        // Assert - Should fail fast on model validation
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var responseContent = await response.Content.ReadAsStringAsync();
        responseContent.Should().NotBeEmpty();
        // Model validation errors are handled by ASP.NET Core and may have different structure
    }

    [Fact]
    public async Task JobWebhookBulk_WithWrongSecretToken_ShouldReturnUnauthorized()
    {
        // Arrange - Valid structure but wrong secret token
        var jobDataList = new[]
        {
            new
            {
                jobTitle = "Software Engineer",
                company = "Test Company",
                location = "Remote",
                emails = "test@example.com",
                emailType = "summary",
                isRemote = true,
                salary = "$100,000",
                link = "https://example.com/job",
                snippet = "Great job opportunity",
                scrapedDate = "2024-10-18T10:00:00Z",
                secretToken = "wrong-token-value"
            }
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/jobwebhook/bulk", jobDataList);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("success").GetBoolean().Should().BeFalse();
        result.GetProperty("message").GetString().Should().Contain("Authentication failed");
    }

    [Fact]
    public async Task JobWebhookBulk_WithEmptyArray_ShouldReturnBadRequest()
    {
        // Arrange
        var jobDataList = new object[0];

        // Act
        var response = await _client.PostAsJsonAsync("/api/jobwebhook/bulk", jobDataList);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("success").GetBoolean().Should().BeFalse();
        result.GetProperty("message").GetString().Should().Contain("at least one job");
    }
}

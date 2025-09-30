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
}

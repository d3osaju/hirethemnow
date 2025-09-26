using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    [HttpPost("login")]
    public ActionResult<object> Login([FromBody] LoginRequest request)
    {
        // Mock authentication for testing
        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
        {
            return BadRequest(new { success = false, message = "Email and password are required" });
        }

        // Mock successful login
        var mockUser = new
        {
            id = "1",
            name = "Test User",
            email = request.Email,
            role = "candidate" // or "employer"
        };

        var mockToken = "mock-jwt-token-123";

        return Ok(new
        {
            success = true,
            message = "Login successful",
            data = new
            {
                user = mockUser,
                token = mockToken
            }
        });
    }

    [HttpPost("register")]
    public ActionResult<object> Register([FromBody] RegisterRequest request)
    {
        // Mock registration for testing
        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
        {
            return BadRequest(new { success = false, message = "Email and password are required" });
        }

        // Mock successful registration
        var mockUser = new
        {
            id = "1",
            name = request.Name ?? "New User",
            email = request.Email,
            role = request.Role ?? "candidate"
        };

        var mockToken = "mock-jwt-token-123";

        return Ok(new
        {
            success = true,
            message = "Registration successful",
            data = new
            {
                user = mockUser,
                token = mockToken
            }
        });
    }

    [HttpPost("google")]
    public ActionResult<object> GoogleAuth([FromBody] GoogleAuthRequest request)
    {
        try
        {
            // Decode the Google JWT token
            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadJwtToken(request.Token);

            // Extract user information from Google token
            var email = jsonToken.Claims.FirstOrDefault(c => c.Type == "email")?.Value;
            var name = jsonToken.Claims.FirstOrDefault(c => c.Type == "name")?.Value;
            var googleId = jsonToken.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
            var picture = jsonToken.Claims.FirstOrDefault(c => c.Type == "picture")?.Value;

            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(googleId))
            {
                return BadRequest(new { success = false, message = "Invalid Google token" });
            }

            // Mock user creation/retrieval (in production, you'd save to database)
            var mockUser = new
            {
                id = googleId,
                name = name ?? "Google User",
                email = email,
                role = "candidate", // Default role for Google sign-in
                picture = picture
            };

            var mockToken = "mock-jwt-token-google-" + googleId;

            return Ok(new
            {
                success = true,
                message = "Google authentication successful",
                data = new
                {
                    user = mockUser,
                    token = mockToken
                }
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = "Invalid Google token: " + ex.Message });
        }
    }

    [HttpPost("logout")]
    public ActionResult<object> Logout()
    {
        return Ok(new { success = true, message = "Logout successful" });
    }

    [HttpGet("profile")]
    public ActionResult<object> GetProfile()
    {
        // Mock profile data
        var mockUser = new
        {
            id = "1",
            name = "Test User",
            email = "test@example.com",
            role = "candidate"
        };

        return Ok(new
        {
            success = true,
            message = "Profile retrieved successfully",
            data = mockUser
        });
    }
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Role { get; set; }
}

public class GoogleAuthRequest
{
    public string Token { get; set; } = string.Empty;
}
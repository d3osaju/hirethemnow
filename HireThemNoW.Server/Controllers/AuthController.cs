using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using Google.Apis.Auth;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IConfiguration configuration, ILogger<AuthController> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    private string GenerateJwtToken(string userId, string email, string name, string role = "candidate")
    {
        var jwtSecret = _configuration["JWT_SECRET"] ?? "ae9d27decc25cb45671ce98206e402e2";
        var key = Encoding.ASCII.GetBytes(jwtSecret);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Name, name),
                new Claim(ClaimTypes.Role, role)
            }),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
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

        var mockToken = GenerateJwtToken("1", request.Email, "Test User");

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

        var mockToken = GenerateJwtToken("1", request.Email, request.Name ?? "New User", request.Role ?? "candidate");

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
    public async Task<ActionResult<object>> GoogleAuth([FromBody] GoogleAuthRequest request)
    {
        try
        {
            var googleClientId = _configuration["GOOGLE_CLIENT_ID"] ?? "419725254966-5i7rgg3h7j984od6mi3ib4tt3rqq8o4j.apps.googleusercontent.com";

            // Verify the Google ID token
            var payload = await GoogleJsonWebSignature.ValidateAsync(request.Token, new GoogleJsonWebSignature.ValidationSettings()
            {
                Audience = new[] { googleClientId }
            });

            if (payload == null)
            {
                return BadRequest(new { success = false, message = "Invalid Google token" });
            }

            // Extract user information from verified Google token
            var email = payload.Email;
            var name = payload.Name;
            var googleId = payload.Subject;
            var picture = payload.Picture;

            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(googleId))
            {
                return BadRequest(new { success = false, message = "Invalid Google token payload" });
            }

            // Generate our own JWT token
            var jwtToken = GenerateJwtToken(googleId, email, name ?? "Google User");

            // Create user object (in production, you'd save to database)
            var user = new
            {
                id = googleId,
                name = name ?? "Google User",
                email = email,
                role = "candidate", // Default role for Google sign-in
                picture = picture
            };

            _logger.LogInformation("Google authentication successful for user: {Email}", email);

            return Ok(new
            {
                success = true,
                message = "Google authentication successful",
                data = new
                {
                    user = user,
                    token = jwtToken
                }
            });
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogWarning("Invalid Google JWT token: {Message}", ex.Message);
            return BadRequest(new { success = false, message = "Invalid Google token" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Google authentication");
            return BadRequest(new { success = false, message = "Google authentication failed" });
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
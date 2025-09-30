using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using Google.Apis.Auth;
using HireThemNoW.Server.Services;
using HireThemNoW.Server.Models;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;
    private readonly IDataService _dataService;

    public AuthController(IConfiguration configuration, ILogger<AuthController> logger, IDataService dataService)
    {
        _configuration = configuration;
        _logger = logger;
        _dataService = dataService;
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
    public async Task<ActionResult<object>> Login([FromBody] LoginRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { success = false, message = "Email and password are required" });
            }

            // Find user by email
            var user = await _dataService.GetUserByEmailAsync(request.Email);
            if (user == null)
            {
                return BadRequest(new { success = false, message = "Invalid email or password" });
            }

            // Ensure trial dates are set for existing users (migration safety)
            UserTrialHelper.EnsureTrialDatesSet(user);

            // Check if user has access (trial or subscription)
            if (!user.HasAccess())
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Your free trial has ended. Please subscribe to continue using HireThemNow.",
                    trialExpired = true
                });
            }

            // Save user if trial dates were just set
            await _dataService.UpdateUserAsync(user);

            // Note: In production, you should verify the password hash
            // For now, we'll accept any password for demo purposes
            var token = GenerateJwtToken(user.Id, user.Email, user.Name, user.Role);

            return Ok(new
            {
                success = true,
                message = "Login successful",
                data = new
                {
                    user = new
                    {
                        id = user.Id,
                        name = user.Name,
                        email = user.Email,
                        role = user.Role,
                        picture = user.Picture,
                        isCompleted = user.IsCompleted
                    },
                    token = token
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            return StatusCode(500, new { success = false, message = "Login failed" });
        }
    }

    [HttpPost("register")]
    public async Task<ActionResult<object>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { success = false, message = "Email and password are required" });
            }

            // Check if user already exists
            var existingUser = await _dataService.GetUserByEmailAsync(request.Email);
            if (existingUser != null)
            {
                return BadRequest(new { success = false, message = "User with this email already exists" });
            }

            // Create new user
            var newUser = new User
            {
                Name = request.Name ?? "New User",
                Email = request.Email,
                Role = request.Role ?? "candidate"
            };

            var createdUser = await _dataService.CreateUserAsync(newUser);

            // Check if user has access (should always be true for new users with trial)
            if (!createdUser.HasAccess())
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Unable to create account. Please contact support.",
                    trialExpired = true
                });
            }

            var token = GenerateJwtToken(createdUser.Id, createdUser.Email, createdUser.Name, createdUser.Role);

            return Ok(new
            {
                success = true,
                message = "Registration successful",
                data = new
                {
                    user = new
                    {
                        id = createdUser.Id,
                        name = createdUser.Name,
                        email = createdUser.Email,
                        role = createdUser.Role,
                        isCompleted = createdUser.IsCompleted
                    },
                    token = token
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration");
            return StatusCode(500, new { success = false, message = "Registration failed" });
        }
    }

    [HttpPost("google")]
    public async Task<ActionResult<object>> GoogleAuth([FromBody] GoogleAuthRequest request)
    {
        try
        {
            var googleClientId = _configuration["GOOGLE_CLIENT_ID"] ?? throw new InvalidOperationException("GOOGLE_CLIENT_ID environment variable is required");

            _logger.LogInformation("Starting Google token validation. Client ID: {ClientId}", googleClientId);
            _logger.LogInformation("Current server time: {CurrentTime}", DateTime.UtcNow);

            // Verify the Google ID token with relaxed time validation
            var payload = await GoogleJsonWebSignature.ValidateAsync(request.Token, new GoogleJsonWebSignature.ValidationSettings()
            {
                Audience = new[] { googleClientId },
                IssuedAtClockTolerance = TimeSpan.FromMinutes(10),
                ExpirationTimeClockTolerance = TimeSpan.FromMinutes(10)
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

            // Check if user exists, create if not
            var existingUser = await _dataService.GetUserByEmailAsync(email);
            User user;

            if (existingUser == null)
            {
                // Create new user for Google sign-in
                user = new User
                {
                    Id = googleId,
                    Name = name ?? "Google User",
                    Email = email,
                    Role = "candidate", // Default role for Google sign-in
                    Picture = picture,
                    // Trial is automatically set in CreateUserAsync
                };
                user = await _dataService.CreateUserAsync(user);
            }
            else
            {
                user = existingUser;

                // Ensure trial dates are set for existing users (migration safety)
                UserTrialHelper.EnsureTrialDatesSet(user);

                // Update picture if available
                if (!string.IsNullOrEmpty(picture) && user.Picture != picture)
                {
                    user.Picture = picture;
                }

                await _dataService.UpdateUserAsync(user);
            }

            // Check if user has access (trial or subscription)
            if (!user.HasAccess())
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Your free trial has ended. Please subscribe to continue using HireThemNow.",
                    trialExpired = true
                });
            }

            // Generate our own JWT token
            var jwtToken = GenerateJwtToken(user.Id, user.Email, user.Name, user.Role);

            _logger.LogInformation("Google authentication successful for user: {Email}", email);

            return Ok(new
            {
                success = true,
                message = "Google authentication successful",
                data = new
                {
                    user = new
                    {
                        id = user.Id,
                        name = user.Name,
                        email = user.Email,
                        role = user.Role,
                        picture = user.Picture,
                        isCompleted = user.IsCompleted
                    },
                    token = jwtToken
                }
            });
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogWarning("Invalid Google JWT token: {Message}", ex.Message);
            _logger.LogWarning("JWT Exception Details: {Details}", ex.ToString());

            // Try to decode token header to understand the issue better
            try
            {
                var tokenParts = request.Token.Split('.');
                if (tokenParts.Length >= 2)
                {
                    var header = tokenParts[0];
                    var payload = tokenParts[1];
                    _logger.LogWarning("Token header (base64): {Header}", header);
                    _logger.LogWarning("Token payload (base64): {Payload}", payload);
                }
            }
            catch (Exception decodeEx)
            {
                _logger.LogWarning("Failed to decode token parts: {Error}", decodeEx.Message);
            }

            return BadRequest(new { success = false, message = "Invalid Google token" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Google authentication: {Message}", ex.Message);
            _logger.LogError("Full exception details: {Details}", ex.ToString());
            return BadRequest(new { success = false, message = "Google authentication failed" });
        }
    }

    [HttpPost("logout")]
    public ActionResult<object> Logout()
    {
        return Ok(new { success = true, message = "Logout successful" });
    }

    [HttpPost("trial/acknowledge")]
    [Authorize]
    public async Task<ActionResult<object>> AcknowledgeTrialEnd()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "User not authenticated" });
            }

            var user = await _dataService.GetUserAsync(userId);
            if (user == null)
            {
                return NotFound(new { success = false, message = "User not found" });
            }

            user.HasSeenTrialEndMessage = true;
            await _dataService.UpdateUserAsync(user);

            return Ok(new
            {
                success = true,
                message = "Trial end message acknowledged"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error acknowledging trial end");
            return StatusCode(500, new { success = false, message = "Failed to acknowledge trial end" });
        }
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<ActionResult<object>> GetProfile()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "User not authenticated" });
            }

            var user = await _dataService.GetUserAsync(userId);
            if (user == null)
            {
                return NotFound(new { success = false, message = "User not found" });
            }

            return Ok(new
            {
                success = true,
                message = "Profile retrieved successfully",
                data = new
                {
                    id = user.Id,
                    name = user.Name,
                    email = user.Email,
                    role = user.Role,
                    picture = user.Picture,
                    phone = user.Phone,
                    location = user.Location,
                    bio = user.Bio,
                    skills = user.Skills,
                    title = user.Title,
                    industry = user.Industry,
                    experience = user.Experience,
                    resumeUrl = user.ResumeUrl,
                    isCompleted = user.IsCompleted,
                    trialStartDate = user.TrialStartDate,
                    trialEndDate = user.TrialEndDate,
                    isTrialActive = user.IsTrialActive,
                    hasSeenTrialEndMessage = user.HasSeenTrialEndMessage,
                    hasActiveSubscription = user.HasActiveSubscription,
                    hasAccess = user.HasAccess(),
                    createdAt = user.CreatedAt
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving profile");
            return StatusCode(500, new { success = false, message = "Profile retrieval failed" });
        }
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
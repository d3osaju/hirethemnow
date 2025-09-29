using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireThemNoW.Server.Models;
using HireThemNoW.Server.Services;
using System.Security.Claims;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IDataService _dataService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IDataService dataService, ILogger<UsersController> logger)
    {
        _dataService = dataService;
        _logger = logger;
    }

    [HttpGet("profile")]
    public async Task<ActionResult<ApiResponse<User>>> GetProfile()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<User>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            var user = await _dataService.GetUserAsync(userId);
            if (user == null)
            {
                // Create user if not exists (for Google auth users)
                var email = User.FindFirst(ClaimTypes.Email)?.Value ?? "";
                var name = User.FindFirst(ClaimTypes.Name)?.Value ?? "";
                var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "candidate";

                user = new User
                {
                    Id = userId,
                    Name = name,
                    Email = email,
                    Role = role
                };

                user = await _dataService.CreateUserAsync(user);
            }

            return Ok(new ApiResponse<User>
            {
                Success = true,
                Message = "Profile retrieved successfully",
                Data = user
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user profile");
            return StatusCode(500, new ApiResponse<User>
            {
                Success = false,
                Message = "An error occurred while retrieving your profile",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPut("profile")]
    public async Task<ActionResult<ApiResponse<User>>> UpdateProfile([FromBody] UpdateUserRequest request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<User>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            var user = await _dataService.GetUserAsync(userId);
            if (user == null)
            {
                return NotFound(new ApiResponse<User>
                {
                    Success = false,
                    Message = "User profile not found"
                });
            }

            // Update only provided fields
            if (!string.IsNullOrEmpty(request.Name))
                user.Name = request.Name;
            if (!string.IsNullOrEmpty(request.Phone))
                user.Phone = request.Phone;
            if (!string.IsNullOrEmpty(request.Location))
                user.Location = request.Location;
            if (!string.IsNullOrEmpty(request.Bio))
                user.Bio = request.Bio;
            if (request.Skills != null)
                user.Skills = request.Skills;
            if (!string.IsNullOrEmpty(request.Title))
                user.Title = request.Title;
            if (!string.IsNullOrEmpty(request.Industry))
                user.Industry = request.Industry;
            if (!string.IsNullOrEmpty(request.Experience))
                user.Experience = request.Experience;
            if (!string.IsNullOrEmpty(request.ResumeUrl))
                user.ResumeUrl = request.ResumeUrl;
            if (request.IsCompleted.HasValue)
                user.IsCompleted = request.IsCompleted.Value;

            var updatedUser = await _dataService.UpdateUserAsync(user);

            return Ok(new ApiResponse<User>
            {
                Success = true,
                Message = "Profile updated successfully",
                Data = updatedUser
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user profile");
            return StatusCode(500, new ApiResponse<User>
            {
                Success = false,
                Message = "An error occurred while updating your profile",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<User>>> GetUser(string id)
    {
        try
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized(new ApiResponse<User>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            var user = await _dataService.GetUserAsync(id);
            if (user == null)
            {
                return NotFound(new ApiResponse<User>
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            // Return limited information for other users (privacy)
            var publicUser = new User
            {
                Id = user.Id,
                Name = user.Name,
                Role = user.Role,
                Picture = user.Picture,
                Location = user.Location,
                Bio = user.Bio,
                Skills = user.Skills,
                Title = user.Title,
                Industry = user.Industry,
                Experience = user.Experience,
                CreatedAt = user.CreatedAt
            };

            return Ok(new ApiResponse<User>
            {
                Success = true,
                Message = "User retrieved successfully",
                Data = publicUser
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user {UserId}", id);
            return StatusCode(500, new ApiResponse<User>
            {
                Success = false,
                Message = "An error occurred while retrieving the user",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("onboarding/complete")]
    public async Task<ActionResult<ApiResponse<User>>> CompleteOnboarding([FromBody] UpdateUserRequest request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<User>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            var user = await _dataService.GetUserAsync(userId);
            if (user == null)
            {
                return NotFound(new ApiResponse<User>
                {
                    Success = false,
                    Message = "User profile not found"
                });
            }

            // Update profile with onboarding data
            if (!string.IsNullOrEmpty(request.Name))
                user.Name = request.Name;
            if (!string.IsNullOrEmpty(request.Phone))
                user.Phone = request.Phone;
            if (!string.IsNullOrEmpty(request.Location))
                user.Location = request.Location;
            if (!string.IsNullOrEmpty(request.Bio))
                user.Bio = request.Bio;
            if (request.Skills != null)
                user.Skills = request.Skills;
            if (!string.IsNullOrEmpty(request.ResumeUrl))
                user.ResumeUrl = request.ResumeUrl;

            // Mark onboarding as completed
            user.IsCompleted = true;

            var updatedUser = await _dataService.UpdateUserAsync(user);

            return Ok(new ApiResponse<User>
            {
                Success = true,
                Message = "Onboarding completed successfully",
                Data = updatedUser
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing onboarding");
            return StatusCode(500, new ApiResponse<User>
            {
                Success = false,
                Message = "An error occurred while completing onboarding",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpDelete("profile")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteProfile()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<object>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            var deleted = await _dataService.DeleteUserAsync(userId);
            if (!deleted)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "User profile not found"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Profile deleted successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user profile");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while deleting your profile",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}
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
    private readonly IS3Service _s3Service;

    public UsersController(IDataService dataService, ILogger<UsersController> logger, IS3Service s3Service)
    {
        _dataService = dataService;
        _logger = logger;
        _s3Service = s3Service;
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

            // Convert S3 key to pre-signed URL if picture exists
            if (!string.IsNullOrEmpty(user.Picture) && !user.Picture.StartsWith("http"))
            {
                try
                {
                    user.Picture = await _s3Service.GetPreSignedUrlAsync(user.Picture, 10080); // 7 days
                    _logger.LogInformation("Generated pre-signed URL for user {UserId} profile picture", userId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to generate pre-signed URL for profile picture of user {UserId}", userId);
                    user.Picture = null; // Clear invalid picture reference
                }
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
            if (!string.IsNullOrEmpty(request.Picture))
                user.Picture = request.Picture;
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

    [HttpPost("profile/picture")]
    public async Task<ActionResult<ApiResponse<string>>> UploadProfilePicture([FromForm] IFormFile picture)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<string>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            if (picture == null || picture.Length == 0)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Success = false,
                    Message = "No file uploaded"
                });
            }

            // Validate file type
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var extension = Path.GetExtension(picture.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new ApiResponse<string>
                {
                    Success = false,
                    Message = "Invalid file type. Only JPG, PNG, and GIF are allowed."
                });
            }

            // Validate file size (max 5MB)
            if (picture.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Success = false,
                    Message = "File size too large. Maximum size is 5MB."
                });
            }

            // Get user before upload
            var user = await _dataService.GetUserAsync(userId);
            if (user == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            // Delete old profile picture from S3 if it exists and is not from Google
            if (!string.IsNullOrEmpty(user.Picture) &&
                !user.Picture.StartsWith("http") &&
                user.Picture.StartsWith("profile-pictures/"))
            {
                await _s3Service.DeleteFileAsync(user.Picture);
                _logger.LogInformation("Deleted old profile picture for user {UserId}", userId);
            }

            // Upload new picture to S3
            using (var stream = picture.OpenReadStream())
            {
                var fileName = $"{userId}_{Guid.NewGuid()}{extension}";
                var contentType = picture.ContentType ?? "image/jpeg";

                // Upload to S3 with profile-pictures prefix
                var s3Key = await _s3Service.UploadFileAsync(stream, fileName, contentType, "profile-pictures");

                // Generate pre-signed URL for immediate access (valid for 7 days)
                var pictureUrl = await _s3Service.GetPreSignedUrlAsync(s3Key, 10080); // 7 days in minutes

                // Update user's picture URL in database (store S3 key)
                user.Picture = s3Key; // Store the S3 key, not the pre-signed URL
                await _dataService.UpdateUserAsync(user);

                _logger.LogInformation("Uploaded profile picture to S3 for user {UserId} with key {S3Key}", userId, s3Key);

                return Ok(new ApiResponse<string>
                {
                    Success = true,
                    Message = "Profile picture uploaded successfully",
                    Data = pictureUrl // Return pre-signed URL to frontend
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading profile picture");
            return StatusCode(500, new ApiResponse<string>
            {
                Success = false,
                Message = "An error occurred while uploading the profile picture",
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

            // Convert S3 key to pre-signed URL if picture exists
            var pictureUrl = user.Picture;
            if (!string.IsNullOrEmpty(pictureUrl) && !pictureUrl.StartsWith("http"))
            {
                try
                {
                    pictureUrl = await _s3Service.GetPreSignedUrlAsync(pictureUrl, 10080); // 7 days
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to generate pre-signed URL for profile picture of user {UserId}", id);
                    pictureUrl = null; // Clear invalid picture reference
                }
            }

            // Return limited information for other users (privacy)
            var publicUser = new User
            {
                Id = user.Id,
                Name = user.Name,
                Role = user.Role,
                Picture = pictureUrl,
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
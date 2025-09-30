using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HireThemNoW.Server.Data;
using HireThemNoW.Server.Models;
using System.Security.Claims;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PrivacyController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PrivacyController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PrivacySettings>>> GetPrivacySettings()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<PrivacySettings>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new ApiResponse<PrivacySettings>
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            var settings = new PrivacySettings
            {
                ProfileVisibility = user.ProfileVisibility,
                AllowAnalyticsDataSharing = user.AllowAnalyticsDataSharing
            };

            return Ok(new ApiResponse<PrivacySettings>
            {
                Success = true,
                Message = "Privacy settings retrieved successfully",
                Data = settings
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<PrivacySettings>
            {
                Success = false,
                Message = $"Error retrieving privacy settings: {ex.Message}"
            });
        }
    }

    [HttpPut]
    public async Task<ActionResult<ApiResponse<PrivacySettings>>> UpdatePrivacySettings([FromBody] UpdatePrivacySettingsRequest request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<PrivacySettings>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new ApiResponse<PrivacySettings>
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            // Update privacy settings
            if (request.ProfileVisibility != null)
            {
                user.ProfileVisibility = request.ProfileVisibility;
            }

            if (request.AllowAnalyticsDataSharing.HasValue)
            {
                user.AllowAnalyticsDataSharing = request.AllowAnalyticsDataSharing.Value;
            }

            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var settings = new PrivacySettings
            {
                ProfileVisibility = user.ProfileVisibility,
                AllowAnalyticsDataSharing = user.AllowAnalyticsDataSharing
            };

            return Ok(new ApiResponse<PrivacySettings>
            {
                Success = true,
                Message = "Privacy settings updated successfully",
                Data = settings
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<PrivacySettings>
            {
                Success = false,
                Message = $"Error updating privacy settings: {ex.Message}"
            });
        }
    }
}

public class PrivacySettings
{
    public string ProfileVisibility { get; set; } = "public";
    public bool AllowAnalyticsDataSharing { get; set; } = true;
}

public class UpdatePrivacySettingsRequest
{
    public string? ProfileVisibility { get; set; }
    public bool? AllowAnalyticsDataSharing { get; set; }
}

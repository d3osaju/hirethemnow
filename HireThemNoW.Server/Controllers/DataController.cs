using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HireThemNoW.Server.Data;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DataController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DataController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportUserData()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "User not authenticated" });
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { success = false, message = "User not found" });
            }

            // Get user's email preferences
            var emailPrefs = await _context.EmailPreferences
                .FirstOrDefaultAsync(ep => ep.UserId == userId);

            // Compile all user data
            var userData = new
            {
                PersonalInformation = new
                {
                    user.Id,
                    user.Name,
                    user.Email,
                    user.Role,
                    user.Phone,
                    user.Location,
                    user.Bio,
                    user.Title,
                    user.Industry,
                    user.Experience,
                    user.Skills,
                    user.CreatedAt,
                    user.UpdatedAt
                },
                PrivacySettings = new
                {
                    user.ProfileVisibility,
                    user.AllowAnalyticsDataSharing
                },
                EmailPreferences = emailPrefs != null ? new
                {
                    emailPrefs.WeeklyPerformanceReport,
                    emailPrefs.MarketingEmails
                } : null,
                TrialInformation = new
                {
                    user.TrialStartDate,
                    user.TrialEndDate,
                    user.IsTrialActive,
                    user.HasActiveSubscription
                },
                ResumeInformation = new
                {
                    user.ResumeUrl,
                    HasResume = !string.IsNullOrEmpty(user.ResumeUrl)
                },
                ExportDate = DateTime.UtcNow,
                ExportVersion = "1.0"
            };

            // Convert to JSON
            var json = JsonSerializer.Serialize(userData, new JsonSerializerOptions
            {
                WriteIndented = true
            });

            var bytes = Encoding.UTF8.GetBytes(json);
            var fileName = $"hirethemnow_data_export_{user.Email}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.json";

            return File(bytes, "application/json", fileName);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = $"Error exporting data: {ex.Message}" });
        }
    }

    [HttpDelete("account")]
    public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "User not authenticated" });
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { success = false, message = "User not found" });
            }

            // Optional: Verify password or require confirmation
            if (request.Confirmation?.ToLower() != "delete")
            {
                return BadRequest(new { success = false, message = "Please type 'DELETE' to confirm account deletion" });
            }

            // Delete email preferences
            var emailPrefs = await _context.EmailPreferences
                .FirstOrDefaultAsync(ep => ep.UserId == userId);
            if (emailPrefs != null)
            {
                _context.EmailPreferences.Remove(emailPrefs);
            }

            // Note: Resume files in S3 would need separate cleanup
            // This could be done via a background job or immediate deletion

            // Delete user account
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Account deleted successfully. We're sorry to see you go."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = $"Error deleting account: {ex.Message}" });
        }
    }
}

public class DeleteAccountRequest
{
    public string? Confirmation { get; set; }
}

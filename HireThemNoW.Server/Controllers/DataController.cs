using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HireThemNoW.Server.Data;
using HireThemNoW.Server.Services;
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
    private readonly IS3Service _s3Service;

    public DataController(ApplicationDbContext context, IS3Service s3Service)
    {
        _context = context;
        _s3Service = s3Service;
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

            // Delete S3 files before deleting database records
            var deletionTasks = new List<Task<bool>>();

            // Delete resume file from S3 if it exists
            if (!string.IsNullOrEmpty(user.ResumeUrl))
            {
                deletionTasks.Add(_s3Service.DeleteFileAsync(user.ResumeUrl));
            }

            // Delete profile picture from S3 if it exists and is an S3 URL
            if (!string.IsNullOrEmpty(user.Picture) && user.Picture.Contains("/"))
            {
                // Only delete if it looks like an S3 key (not a Google profile picture URL)
                if (!user.Picture.StartsWith("http"))
                {
                    deletionTasks.Add(_s3Service.DeleteFileAsync(user.Picture));
                }
            }

            // Wait for all S3 deletions to complete
            if (deletionTasks.Any())
            {
                await Task.WhenAll(deletionTasks);
            }

            // Delete email preferences (will be deleted automatically via CASCADE, but explicit is clearer)
            var emailPrefs = await _context.EmailPreferences
                .FirstOrDefaultAsync(ep => ep.UserId == userId);
            if (emailPrefs != null)
            {
                _context.EmailPreferences.Remove(emailPrefs);
            }

            // Delete resume analysis records (will be deleted automatically via CASCADE)
            var resumeAnalyses = await _context.ResumeAnalyses
                .Where(ra => ra.UserId == userId)
                .ToListAsync();
            if (resumeAnalyses.Any())
            {
                _context.ResumeAnalyses.RemoveRange(resumeAnalyses);
            }

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

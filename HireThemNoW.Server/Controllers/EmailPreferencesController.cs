using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using HireThemNoW.Server.Services;
using HireThemNoW.Server.Models;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmailPreferencesController : ControllerBase
{
    private readonly ILogger<EmailPreferencesController> _logger;
    private readonly IDataService _dataService;

    public EmailPreferencesController(ILogger<EmailPreferencesController> logger, IDataService dataService)
    {
        _logger = logger;
        _dataService = dataService;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetEmailPreferences()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "User not authenticated" });
            }

            var preferences = await _dataService.GetEmailPreferencesAsync(userId);

            // If preferences don't exist, return default values (disabled)
            if (preferences == null)
            {
                return Ok(new
                {
                    success = true,
                    message = "Email preferences retrieved successfully",
                    data = new
                    {
                        weeklyPerformanceReport = false,
                        marketingEmails = false
                    }
                });
            }

            return Ok(new
            {
                success = true,
                message = "Email preferences retrieved successfully",
                data = new
                {
                    weeklyPerformanceReport = preferences.WeeklyPerformanceReport,
                    marketingEmails = preferences.MarketingEmails
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving email preferences");
            return StatusCode(500, new { success = false, message = "Failed to retrieve email preferences" });
        }
    }

    [HttpPut]
    public async Task<ActionResult<object>> UpdateEmailPreferences([FromBody] UpdateEmailPreferenceRequest request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "User not authenticated" });
            }

            var preferences = await _dataService.GetEmailPreferencesAsync(userId);

            if (preferences == null)
            {
                // Create new preferences
                preferences = new EmailPreference
                {
                    UserId = userId,
                    WeeklyPerformanceReport = request.WeeklyPerformanceReport ?? false,
                    MarketingEmails = request.MarketingEmails ?? false
                };

                await _dataService.CreateEmailPreferencesAsync(preferences);
            }
            else
            {
                // Update existing preferences
                if (request.WeeklyPerformanceReport.HasValue)
                {
                    preferences.WeeklyPerformanceReport = request.WeeklyPerformanceReport.Value;
                }

                if (request.MarketingEmails.HasValue)
                {
                    preferences.MarketingEmails = request.MarketingEmails.Value;
                }

                preferences.UpdatedAt = DateTime.UtcNow;
                await _dataService.UpdateEmailPreferencesAsync(preferences);
            }

            return Ok(new
            {
                success = true,
                message = "Email preferences updated successfully",
                data = new
                {
                    weeklyPerformanceReport = preferences.WeeklyPerformanceReport,
                    marketingEmails = preferences.MarketingEmails
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating email preferences");
            return StatusCode(500, new { success = false, message = "Failed to update email preferences" });
        }
    }
}
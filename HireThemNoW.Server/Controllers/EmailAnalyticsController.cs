using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireThemNoW.Server.Models.DTOs;
using HireThemNoW.Server.Services;
using System.Security.Claims;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmailAnalyticsController : ControllerBase
{
    private readonly IEmailAnalyticsService _analyticsService;

    public EmailAnalyticsController(IEmailAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    [HttpGet]
    public async Task<ActionResult<EmailAnalyticsDto>> GetEmailAnalytics([FromQuery] EmailAnalyticsFilter? filter = null)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var analytics = await _analyticsService.GetEmailAnalyticsAsync(userId, filter);
            return Ok(new { message = "Email analytics retrieved successfully", data = analytics });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    [HttpGet("summary")]
    public async Task<ActionResult<EmailCampaignSummary>> GetCampaignSummary([FromQuery] string? campaignId = null)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var summary = await _analyticsService.GetCampaignSummaryAsync(userId, campaignId);
            return Ok(new { message = "Campaign summary retrieved successfully", data = summary });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    [HttpGet("performance")]
    public async Task<ActionResult<List<EmailPerformanceMetric>>> GetPerformanceMetrics([FromQuery] EmailAnalyticsFilter? filter = null)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var metrics = await _analyticsService.GetPerformanceMetricsAsync(userId, filter);
            return Ok(new { message = "Performance metrics retrieved successfully", data = metrics });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    [HttpGet("responses")]
    public async Task<ActionResult<List<ResponseAnalytic>>> GetResponseAnalytics([FromQuery] EmailAnalyticsFilter? filter = null)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var analytics = await _analyticsService.GetResponseAnalyticsAsync(userId, filter);
            return Ok(new { message = "Response analytics retrieved successfully", data = analytics });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    [HttpGet("trends")]
    public async Task<ActionResult<List<TimeSeriesData>>> GetEmailTrends([FromQuery] EmailAnalyticsFilter? filter = null)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var trends = await _analyticsService.GetEmailTrendsAsync(userId, filter);
            return Ok(new { message = "Email trends retrieved successfully", data = trends });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    [HttpGet("engagement")]
    public async Task<ActionResult<EmailEngagementStats>> GetEngagementStats([FromQuery] EmailAnalyticsFilter? filter = null)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var stats = await _analyticsService.GetEngagementStatsAsync(userId, filter);
            return Ok(new { message = "Engagement stats retrieved successfully", data = stats });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    [HttpGet("campaigns/comparison")]
    public async Task<ActionResult<List<CampaignComparisonDto>>> GetCampaignComparison([FromQuery] string[]? campaignIds = null)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var campaigns = campaignIds?.ToList();
            var comparison = await _analyticsService.GetCampaignComparisonAsync(userId, campaigns);
            return Ok(new { message = "Campaign comparison retrieved successfully", data = comparison });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }
}
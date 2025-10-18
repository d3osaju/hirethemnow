using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HireThemNoW.Server.Data;
using HireThemNoW.Server.Models;
using System.Security.Claims;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/admin/analytics")]
[Authorize(Roles = "admin")]
public class AdminAnalyticsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AdminAnalyticsController> _logger;

    public AdminAnalyticsController(ApplicationDbContext context, ILogger<AdminAnalyticsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("test")]
    public ActionResult<object> Test()
    {
        var adminUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var adminEmail = User.FindFirst(ClaimTypes.Email)?.Value;
        var adminRole = User.FindFirst(ClaimTypes.Role)?.Value;
        
        _logger.LogInformation("Admin analytics test endpoint accessed by user {UserId}", adminUserId);
        
        return Ok(new { 
            message = "Admin analytics controller is working", 
            timestamp = DateTime.UtcNow,
            user = new {
                id = adminUserId,
                email = adminEmail,
                role = adminRole
            }
        });
    }

    [HttpGet("metrics")]
    public async Task<ActionResult<ApiResponse<DashboardMetrics>>> GetMetrics()
    {
        try
        {
            var adminUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("Admin user {UserId} requesting dashboard metrics", adminUserId);

            var now = DateTime.UtcNow;
            var thirtyDaysAgo = now.AddDays(-30);

            // Get total users
            var totalUsers = await _context.Users.CountAsync();
            
            // Get user growth (last 30 days vs previous 30 days)
            var recentUsers = await _context.Users
                .Where(u => u.CreatedAt >= thirtyDaysAgo)
                .CountAsync();
            
            var previousPeriodUsers = await _context.Users
                .Where(u => u.CreatedAt >= thirtyDaysAgo.AddDays(-30) && u.CreatedAt < thirtyDaysAgo)
                .CountAsync();
            
            var userGrowth = previousPeriodUsers > 0 
                ? ((double)(recentUsers - previousPeriodUsers) / previousPeriodUsers) * 100 
                : recentUsers > 0 ? 100 : 0;

            // For now, return mock data for job-related metrics since we don't have job tables yet
            var metrics = new DashboardMetrics
            {
                TotalUsers = totalUsers,
                UserGrowth = Math.Round(userGrowth, 1),
                ActiveJobs = 0, // TODO: Implement when job table exists
                JobGrowth = 0,
                RecentRegistrations = recentUsers,
                TotalApplications = 0, // TODO: Implement when application table exists
                ApplicationGrowth = 0
            };

            return Ok(new ApiResponse<DashboardMetrics>
            {
                Success = true,
                Message = "Dashboard metrics retrieved successfully",
                Data = metrics
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving dashboard metrics");
            return StatusCode(500, new ApiResponse<DashboardMetrics>
            {
                Success = false,
                Message = "Failed to retrieve dashboard metrics"
            });
        }
    }

    [HttpGet("charts")]
    public async Task<ActionResult<ApiResponse<ChartData>>> GetChartData([FromQuery] string range = "30d")
    {
        try
        {
            var adminUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("Admin user {UserId} requesting chart data for range {Range}", adminUserId, range);

            var days = range switch
            {
                "7d" => 7,
                "30d" => 30,
                "90d" => 90,
                "1y" => 365,
                _ => 30
            };

            var startDate = DateTime.UtcNow.AddDays(-days);

            // Get user registrations by day
            var userRegistrations = await _context.Users
                .Where(u => u.CreatedAt >= startDate)
                .GroupBy(u => u.CreatedAt.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .OrderBy(x => x.Date)
                .ToListAsync();

            // Get user roles distribution
            var userRoles = await _context.Users
                .GroupBy(u => u.Role)
                .Select(g => new { Role = g.Key, Count = g.Count() })
                .ToListAsync();

            var chartData = new ChartData
            {
                UserRegistrations = userRegistrations.Select(ur => new UserRegistrationData
                {
                    Date = ur.Date.ToString("yyyy-MM-dd"),
                    Count = ur.Count
                }).ToList(),
                JobPostings = new List<JobPostingData>(), // TODO: Implement when job table exists
                UserRoles = userRoles.Select(ur => new UserRoleData
                {
                    Role = ur.Role,
                    Count = ur.Count
                }).ToList()
            };

            return Ok(new ApiResponse<ChartData>
            {
                Success = true,
                Message = "Chart data retrieved successfully",
                Data = chartData
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving chart data");
            return StatusCode(500, new ApiResponse<ChartData>
            {
                Success = false,
                Message = "Failed to retrieve chart data"
            });
        }
    }

    [HttpGet("activity")]
    public async Task<ActionResult<ApiResponse<List<RecentActivity>>>> GetRecentActivity([FromQuery] int limit = 10)
    {
        try
        {
            var adminUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("Admin user {UserId} requesting recent activity with limit {Limit}", adminUserId, limit);

            // Get recent user registrations
            var recentUsers = await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .Take(limit)
                .Select(u => new RecentActivity
                {
                    Id = Guid.NewGuid().ToString(),
                    Type = "user_registered",
                    Description = $"New user {u.Name} registered",
                    Timestamp = u.CreatedAt,
                    UserId = u.Id
                })
                .ToListAsync();

            // TODO: Add job postings and applications when those tables exist

            var activities = recentUsers
                .OrderByDescending(a => a.Timestamp)
                .Take(limit)
                .ToList();

            return Ok(new ApiResponse<List<RecentActivity>>
            {
                Success = true,
                Message = "Recent activity retrieved successfully",
                Data = activities
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving recent activity");
            return StatusCode(500, new ApiResponse<List<RecentActivity>>
            {
                Success = false,
                Message = "Failed to retrieve recent activity"
            });
        }
    }
}

// DTOs for chart data
public class DashboardMetrics
{
    public int TotalUsers { get; set; }
    public double UserGrowth { get; set; }
    public int ActiveJobs { get; set; }
    public double JobGrowth { get; set; }
    public int RecentRegistrations { get; set; }
    public int TotalApplications { get; set; }
    public double ApplicationGrowth { get; set; }
}

public class ChartData
{
    public List<UserRegistrationData> UserRegistrations { get; set; } = new();
    public List<JobPostingData> JobPostings { get; set; } = new();
    public List<UserRoleData> UserRoles { get; set; } = new();
}

public class UserRegistrationData
{
    public string Date { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class JobPostingData
{
    public string Date { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class UserRoleData
{
    public string Role { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class RecentActivity
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string? UserId { get; set; }
    public int? JobId { get; set; }
}
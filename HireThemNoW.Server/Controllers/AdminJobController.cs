using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HireThemNoW.Server.Data;
using HireThemNoW.Server.Models;
using System.Security.Claims;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/admin/jobs")]
[Authorize(Roles = "admin")]
public class AdminJobController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AdminJobController> _logger;

    public AdminJobController(ApplicationDbContext context, ILogger<AdminJobController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public Task<ActionResult<ApiResponse<PagedResult<AdminJobOpportunityDto>>>> GetJobs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] string? locationType = null,
        [FromQuery] string? sortBy = "postedAt",
        [FromQuery] string? sortOrder = "desc")
    {
        try
        {
            var adminUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("Admin user {UserId} requesting jobs - Page: {Page}, Size: {PageSize}, Search: '{Search}', Status: {Status}, LocationType: {LocationType}, Sort: {SortBy} {SortOrder}",
                adminUserId, page, pageSize, search, status, locationType, sortBy, sortOrder);

            // For now, return empty results since we don't have a jobs table yet
            // TODO: Implement when job posting functionality is added
            var result = new PagedResult<AdminJobOpportunityDto>
            {
                Items = new List<AdminJobOpportunityDto>(),
                TotalCount = 0,
                Page = page,
                PageSize = pageSize,
                TotalPages = 0
            };

            return Task.FromResult<ActionResult<ApiResponse<PagedResult<AdminJobOpportunityDto>>>>(Ok(new ApiResponse<PagedResult<AdminJobOpportunityDto>>
            {
                Success = true,
                Message = "Jobs retrieved successfully",
                Data = result
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving jobs");
            return Task.FromResult<ActionResult<ApiResponse<PagedResult<AdminJobOpportunityDto>>>>(StatusCode(500, new ApiResponse<PagedResult<AdminJobOpportunityDto>>
            {
                Success = false,
                Message = "Failed to retrieve jobs"
            }));
        }
    }

    [HttpGet("{id}")]
    public Task<ActionResult<ApiResponse<AdminJobOpportunityWithApplicationsDto>>> GetJob(int id)
    {
        try
        {
            var adminUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("Admin user {UserId} requesting job details for ID {JobId}", adminUserId, id);

            // TODO: Implement when job posting functionality is added
            return Task.FromResult<ActionResult<ApiResponse<AdminJobOpportunityWithApplicationsDto>>>(NotFound(new ApiResponse<AdminJobOpportunityWithApplicationsDto>
            {
                Success = false,
                Message = "Job not found"
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving job {JobId}", id);
            return Task.FromResult<ActionResult<ApiResponse<AdminJobOpportunityWithApplicationsDto>>>(StatusCode(500, new ApiResponse<AdminJobOpportunityWithApplicationsDto>
            {
                Success = false,
                Message = "Failed to retrieve job"
            }));
        }
    }

    [HttpPost]
    public Task<ActionResult<ApiResponse<AdminJobOpportunityDto>>> CreateJob([FromBody] CreateJobRequest request)
    {
        try
        {
            var adminUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("Admin user {UserId} creating new job: {Title} at {Company}", adminUserId, request.Title, request.Company);

            // TODO: Implement when job posting functionality is added
            return Task.FromResult<ActionResult<ApiResponse<AdminJobOpportunityDto>>>(StatusCode(501, new ApiResponse<AdminJobOpportunityDto>
            {
                Success = false,
                Message = "Job creation not yet implemented"
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating job");
            return Task.FromResult<ActionResult<ApiResponse<AdminJobOpportunityDto>>>(StatusCode(500, new ApiResponse<AdminJobOpportunityDto>
            {
                Success = false,
                Message = "Failed to create job"
            }));
        }
    }

    [HttpPut("{id}")]
    public Task<ActionResult<ApiResponse<AdminJobOpportunityDto>>> UpdateJob(int id, [FromBody] UpdateJobRequest request)
    {
        try
        {
            var adminUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("Admin user {UserId} updating job {JobId}", adminUserId, id);

            // TODO: Implement when job posting functionality is added
            return Task.FromResult<ActionResult<ApiResponse<AdminJobOpportunityDto>>>(NotFound(new ApiResponse<AdminJobOpportunityDto>
            {
                Success = false,
                Message = "Job not found"
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating job {JobId}", id);
            return Task.FromResult<ActionResult<ApiResponse<AdminJobOpportunityDto>>>(StatusCode(500, new ApiResponse<AdminJobOpportunityDto>
            {
                Success = false,
                Message = "Failed to update job"
            }));
        }
    }

    [HttpDelete("{id}")]
    public Task<ActionResult<ApiResponse<object>>> DeleteJob(int id)
    {
        try
        {
            var adminUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("Admin user {UserId} deleting job {JobId}", adminUserId, id);

            // TODO: Implement when job posting functionality is added
            return Task.FromResult<ActionResult<ApiResponse<object>>>(NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Job not found"
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting job {JobId}", id);
            return Task.FromResult<ActionResult<ApiResponse<object>>>(StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Failed to delete job"
            }));
        }
    }
}

// DTOs for job management
public class AdminJobOpportunityDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string LocationType { get; set; } = string.Empty;
    public int? SalaryMin { get; set; }
    public int? SalaryMax { get; set; }
    public string Description { get; set; } = string.Empty;
    public List<string> Requirements { get; set; } = new();
    public List<string> Benefits { get; set; } = new();
    public string Status { get; set; } = string.Empty;
    public DateTime PostedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int ApplicationCount { get; set; }
    public int ViewCount { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
}

public class AdminJobOpportunityWithApplicationsDto : AdminJobOpportunityDto
{
    public List<JobApplicationDto> Applications { get; set; } = new();
}

public class JobApplicationDto
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public int JobId { get; set; }
    public DateTime AppliedAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public UserSummaryDto User { get; set; } = new();
}

public class UserSummaryDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Picture { get; set; }
}

public class CreateJobRequest
{
    public string Title { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string LocationType { get; set; } = "onsite";
    public int? SalaryMin { get; set; }
    public int? SalaryMax { get; set; }
    public string Description { get; set; } = string.Empty;
    public List<string> Requirements { get; set; } = new();
    public List<string> Benefits { get; set; } = new();
    public string Status { get; set; } = "active";
    public DateTime? ExpiresAt { get; set; }
}

public class UpdateJobRequest
{
    public string? Title { get; set; }
    public string? Company { get; set; }
    public string? Location { get; set; }
    public string? LocationType { get; set; }
    public int? SalaryMin { get; set; }
    public int? SalaryMax { get; set; }
    public string? Description { get; set; }
    public List<string>? Requirements { get; set; }
    public List<string>? Benefits { get; set; }
    public string? Status { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
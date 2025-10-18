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
    public async Task<ActionResult<ApiResponse<PagedResult<AdminJobOpportunityDto>>>> GetJobs(
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

            // Query the JobOpportunities table created by the webhook
            var query = _context.JobOpportunities.AsQueryable();

            // Apply search filter
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(j => j.JobTitle.Contains(search) || 
                                       j.Company.Contains(search) || 
                                       j.Location.Contains(search));
            }

            // Apply status filter (map to isRemote for now)
            if (!string.IsNullOrEmpty(status))
            {
                if (status.ToLower() == "remote")
                {
                    query = query.Where(j => j.IsRemote);
                }
                else if (status.ToLower() == "onsite")
                {
                    query = query.Where(j => !j.IsRemote);
                }
            }

            // Apply location type filter
            if (!string.IsNullOrEmpty(locationType))
            {
                if (locationType.ToLower() == "remote")
                {
                    query = query.Where(j => j.IsRemote);
                }
                else if (locationType.ToLower() == "onsite")
                {
                    query = query.Where(j => !j.IsRemote);
                }
            }

            // Apply sorting
            query = sortBy?.ToLower() switch
            {
                "title" => sortOrder?.ToLower() == "desc" 
                    ? query.OrderByDescending(j => j.JobTitle)
                    : query.OrderBy(j => j.JobTitle),
                "company" => sortOrder?.ToLower() == "desc"
                    ? query.OrderByDescending(j => j.Company)
                    : query.OrderBy(j => j.Company),
                "location" => sortOrder?.ToLower() == "desc"
                    ? query.OrderByDescending(j => j.Location)
                    : query.OrderBy(j => j.Location),
                "createdat" or "postedat" or _ => sortOrder?.ToLower() == "desc"
                    ? query.OrderByDescending(j => j.CreatedAt)
                    : query.OrderBy(j => j.CreatedAt)
            };

            // Get total count
            var totalCount = await query.CountAsync();

            // Apply pagination
            var jobs = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Map to AdminJobOpportunityDto with consistent field mapping
            var adminJobs = jobs.Select(j => new AdminJobOpportunityDto
            {
                Id = j.Id,
                Title = j.JobTitle,
                Company = j.Company,
                Location = j.Location,
                LocationType = j.IsRemote ? "remote" : "onsite",
                SalaryMin = ParseSalaryMin(j.Salary),
                SalaryMax = ParseSalaryMax(j.Salary),
                Description = j.Snippet ?? string.Empty,
                Requirements = new List<string>(), // Not available in webhook data
                Benefits = new List<string>(), // Not available in webhook data
                Status = "active", // Default status
                PostedAt = j.ScrapedDate ?? j.CreatedAt,
                ExpiresAt = null, // Not available in webhook data
                ApplicationCount = 0, // Not tracked yet
                ViewCount = 0, // Not tracked yet
                CreatedBy = "Webhook", // Indicate source
                UpdatedAt = j.CreatedAt
            }).ToList();

            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            var result = new PagedResult<AdminJobOpportunityDto>
            {
                Items = adminJobs,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages
            };

            return Ok(new ApiResponse<PagedResult<AdminJobOpportunityDto>>
            {
                Success = true,
                Message = "Jobs retrieved successfully",
                Data = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving jobs");
            return StatusCode(500, new ApiResponse<PagedResult<AdminJobOpportunityDto>>
            {
                Success = false,
                Message = "Failed to retrieve jobs"
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<AdminJobOpportunityWithApplicationsDto>>> GetJob(int id)
    {
        try
        {
            var adminUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("Admin user {UserId} requesting job details for ID {JobId}", adminUserId, id);

            // Query database for job opportunity by ID
            var job = await _context.JobOpportunities
                .FirstOrDefaultAsync(j => j.Id == id);

            if (job == null)
            {
                _logger.LogWarning("Job {JobId} not found for admin user {UserId}", id, adminUserId);
                return NotFound(new ApiResponse<AdminJobOpportunityWithApplicationsDto>
                {
                    Success = false,
                    Message = "Job not found"
                });
            }

            // Parse recruiter emails from the Emails field
            var recruiterEmails = ParseRecruiterEmails(job.Emails);

            // Map JobOpportunity entity to response DTO including all available fields
            var jobDto = new AdminJobOpportunityWithApplicationsDto
            {
                Id = job.Id,
                Title = job.JobTitle,
                Company = job.Company,
                Location = job.Location,
                LocationType = job.IsRemote ? "remote" : "onsite",
                SalaryMin = ParseSalaryMin(job.Salary),
                SalaryMax = ParseSalaryMax(job.Salary),
                Description = job.Snippet ?? string.Empty,
                Requirements = new List<string>(), // Not available in webhook data
                Benefits = new List<string>(), // Not available in webhook data
                Status = "active", // Default status
                PostedAt = job.ScrapedDate ?? job.CreatedAt,
                ExpiresAt = null, // Not available in webhook data
                ApplicationCount = 0, // Not tracked yet - will be updated when applications are implemented
                ViewCount = 0, // Not tracked yet
                CreatedBy = "Webhook", // Indicate source
                UpdatedAt = job.CreatedAt,
                RecruiterEmails = recruiterEmails,
                EmailType = job.EmailType ?? string.Empty,
                OriginalJobLink = job.Link ?? string.Empty,
                ScrapedDate = job.ScrapedDate,
                Applications = new List<JobApplicationDto>() // Empty for now - will be populated when applications are implemented
            };

            _logger.LogInformation("Successfully retrieved job {JobId} for admin user {UserId}", id, adminUserId);

            return Ok(new ApiResponse<AdminJobOpportunityWithApplicationsDto>
            {
                Success = true,
                Message = "Job retrieved successfully",
                Data = jobDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving job {JobId} for admin user {UserId}", id, User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            return StatusCode(500, new ApiResponse<AdminJobOpportunityWithApplicationsDto>
            {
                Success = false,
                Message = "Failed to retrieve job"
            });
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

    private static int? ParseSalaryMin(string? salary)
    {
        if (string.IsNullOrWhiteSpace(salary)) return null;
        
        try
        {
            // Try to extract minimum salary from formats like "$50,000-$60,000" or "$50K-$60K"
            var match = System.Text.RegularExpressions.Regex.Match(salary, @"\$?(\d+(?:,\d{3})*(?:\.\d{2})?)[kK]?");
            if (match.Success)
            {
                var value = match.Groups[1].Value.Replace(",", "").Replace(".", "");
                if (int.TryParse(value, out var result))
                {
                    // If it ends with K, multiply by 1000
                    if (salary.ToUpper().Contains("K"))
                        result *= 1000;
                    return result;
                }
            }
        }
        catch (Exception)
        {
            // Return null if parsing fails
        }
        return null;
    }

    private static int? ParseSalaryMax(string? salary)
    {
        if (string.IsNullOrWhiteSpace(salary)) return null;
        
        try
        {
            // Try to extract maximum salary from formats like "$50,000-$60,000" or "$50K-$60K"
            var matches = System.Text.RegularExpressions.Regex.Matches(salary, @"\$?(\d+(?:,\d{3})*(?:\.\d{2})?)[kK]?");
            if (matches.Count >= 2)
            {
                var value = matches[1].Groups[1].Value.Replace(",", "").Replace(".", "");
                if (int.TryParse(value, out var result))
                {
                    // If it ends with K, multiply by 1000
                    if (salary.ToUpper().Contains("K"))
                        result *= 1000;
                    return result;
                }
            }
            return ParseSalaryMin(salary); // If no range, return the single value
        }
        catch (Exception)
        {
            // Return null if parsing fails
            return null;
        }
    }

    private static List<string> ParseRecruiterEmails(string emails)
    {
        var emailList = new List<string>();
        
        if (string.IsNullOrWhiteSpace(emails))
        {
            return emailList;
        }

        try
        {
            // Handle various email formats and separators
            var separators = new[] { ',', ';', '\n', '\r', '|', ' ' };
            var emailCandidates = emails.Split(separators, StringSplitOptions.RemoveEmptyEntries);

            foreach (var emailCandidate in emailCandidates)
            {
                var trimmedEmail = emailCandidate.Trim();
                
                // Remove common prefixes and suffixes that might be included
                trimmedEmail = trimmedEmail.Trim('"', '\'', '<', '>', '(', ')', '[', ']');
                
                // Basic email validation using regex
                if (!string.IsNullOrWhiteSpace(trimmedEmail) && 
                    System.Text.RegularExpressions.Regex.IsMatch(trimmedEmail, 
                    @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"))
                {
                    // Convert to lowercase for consistency and avoid duplicates
                    var normalizedEmail = trimmedEmail.ToLowerInvariant();
                    if (!emailList.Contains(normalizedEmail))
                    {
                        emailList.Add(normalizedEmail);
                    }
                }
            }
        }
        catch (Exception)
        {
            // If parsing fails, return empty list rather than throwing
            // This ensures the job details are still displayed even if email parsing fails
            return new List<string>();
        }

        return emailList;
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
    public List<string> RecruiterEmails { get; set; } = new();
    public string EmailType { get; set; } = string.Empty;
    public string OriginalJobLink { get; set; } = string.Empty;
    public DateTime? ScrapedDate { get; set; }
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
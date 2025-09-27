using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireThemNoW.Server.Models;
using HireThemNoW.Server.Services;
using System.Security.Claims;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JobsController : ControllerBase
{
    private readonly IDataService _dataService;
    private readonly ILogger<JobsController> _logger;

    public JobsController(IDataService dataService, ILogger<JobsController> logger)
    {
        _dataService = dataService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<Job>>>> GetJobs(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? location = null,
        [FromQuery] string? type = null,
        [FromQuery] decimal? minSalary = null,
        [FromQuery] decimal? maxSalary = null,
        [FromQuery] string? skills = null)
    {
        try
        {
            var filters = new JobFilters
            {
                Search = search,
                Location = location,
                Type = type,
                MinSalary = minSalary,
                MaxSalary = maxSalary,
                Skills = !string.IsNullOrEmpty(skills)
                    ? skills.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList()
                    : null
            };

            var jobs = await _dataService.GetJobsAsync(page, limit, filters);
            var total = await _dataService.GetJobsCountAsync(filters);

            var response = new PaginatedResponse<Job>
            {
                Items = jobs,
                Total = total,
                Page = page,
                Limit = limit
            };

            return Ok(new ApiResponse<PaginatedResponse<Job>>
            {
                Success = true,
                Message = "Jobs retrieved successfully",
                Data = response
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving jobs");
            return StatusCode(500, new ApiResponse<PaginatedResponse<Job>>
            {
                Success = false,
                Message = "An error occurred while retrieving jobs",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<Job>>> GetJob(string id)
    {
        try
        {
            var job = await _dataService.GetJobAsync(id);
            if (job == null)
            {
                return NotFound(new ApiResponse<Job>
                {
                    Success = false,
                    Message = "Job not found"
                });
            }

            return Ok(new ApiResponse<Job>
            {
                Success = true,
                Message = "Job retrieved successfully",
                Data = job
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving job {JobId}", id);
            return StatusCode(500, new ApiResponse<Job>
            {
                Success = false,
                Message = "An error occurred while retrieving the job",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ApiResponse<Job>>> CreateJob([FromBody] CreateJobRequest request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<Job>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            var job = new Job
            {
                Title = request.Title,
                Company = request.Company,
                Description = request.Description,
                Requirements = request.Requirements,
                Location = request.Location,
                Salary = request.Salary,
                Type = request.Type,
                EmployerId = userId
            };

            var createdJob = await _dataService.CreateJobAsync(job);

            return CreatedAtAction(nameof(GetJob), new { id = createdJob.Id }, new ApiResponse<Job>
            {
                Success = true,
                Message = "Job created successfully",
                Data = createdJob
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating job");
            return StatusCode(500, new ApiResponse<Job>
            {
                Success = false,
                Message = "An error occurred while creating the job",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<Job>>> UpdateJob(string id, [FromBody] UpdateJobRequest request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<Job>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            var existingJob = await _dataService.GetJobAsync(id);
            if (existingJob == null)
            {
                return NotFound(new ApiResponse<Job>
                {
                    Success = false,
                    Message = "Job not found"
                });
            }

            if (existingJob.EmployerId != userId)
            {
                return Forbid();
            }

            // Update only provided fields
            if (!string.IsNullOrEmpty(request.Title))
                existingJob.Title = request.Title;
            if (!string.IsNullOrEmpty(request.Company))
                existingJob.Company = request.Company;
            if (!string.IsNullOrEmpty(request.Description))
                existingJob.Description = request.Description;
            if (request.Requirements != null)
                existingJob.Requirements = request.Requirements;
            if (!string.IsNullOrEmpty(request.Location))
                existingJob.Location = request.Location;
            if (request.Salary != null)
                existingJob.Salary = request.Salary;
            if (!string.IsNullOrEmpty(request.Type))
                existingJob.Type = request.Type;
            if (request.IsActive.HasValue)
                existingJob.IsActive = request.IsActive.Value;

            var updatedJob = await _dataService.UpdateJobAsync(existingJob);

            return Ok(new ApiResponse<Job>
            {
                Success = true,
                Message = "Job updated successfully",
                Data = updatedJob
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating job {JobId}", id);
            return StatusCode(500, new ApiResponse<Job>
            {
                Success = false,
                Message = "An error occurred while updating the job",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> DeleteJob(string id)
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

            var existingJob = await _dataService.GetJobAsync(id);
            if (existingJob == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Job not found"
                });
            }

            if (existingJob.EmployerId != userId)
            {
                return Forbid();
            }

            var deleted = await _dataService.DeleteJobAsync(id);
            if (!deleted)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to delete job"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Job deleted successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting job {JobId}", id);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while deleting the job",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}
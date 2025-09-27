using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireThemNoW.Server.Models;
using HireThemNoW.Server.Services;
using System.Security.Claims;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ApplicationsController : ControllerBase
{
    private readonly IDataService _dataService;
    private readonly ILogger<ApplicationsController> _logger;

    public ApplicationsController(IDataService dataService, ILogger<ApplicationsController> logger)
    {
        _dataService = dataService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<Application>>>> GetApplications(
        [FromQuery] string? jobId = null)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<List<Application>>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            List<Application> applications;

            if (userRole == "employer")
            {
                // Employers see applications for their jobs
                applications = await _dataService.GetApplicationsAsync(jobId: jobId);

                // Filter to only applications for jobs posted by this employer
                var employerJobs = await _dataService.GetJobsAsync(1, int.MaxValue);
                var employerJobIds = employerJobs.Where(j => j.EmployerId == userId).Select(j => j.Id).ToHashSet();
                applications = applications.Where(a => employerJobIds.Contains(a.JobId)).ToList();
            }
            else
            {
                // Candidates see their own applications
                applications = await _dataService.GetApplicationsAsync(candidateId: userId);
            }

            // Populate job details for each application
            foreach (var application in applications)
            {
                application.Job = await _dataService.GetJobAsync(application.JobId);
            }

            return Ok(new ApiResponse<List<Application>>
            {
                Success = true,
                Message = "Applications retrieved successfully",
                Data = applications
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving applications");
            return StatusCode(500, new ApiResponse<List<Application>>
            {
                Success = false,
                Message = "An error occurred while retrieving applications",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<Application>>> GetApplication(string id)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<Application>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            var application = await _dataService.GetApplicationAsync(id);
            if (application == null)
            {
                return NotFound(new ApiResponse<Application>
                {
                    Success = false,
                    Message = "Application not found"
                });
            }

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Check permissions
            if (userRole == "candidate" && application.CandidateId != userId)
            {
                return Forbid();
            }
            else if (userRole == "employer")
            {
                var job = await _dataService.GetJobAsync(application.JobId);
                if (job == null || job.EmployerId != userId)
                {
                    return Forbid();
                }
            }

            // Populate related data
            application.Job = await _dataService.GetJobAsync(application.JobId);
            application.Candidate = await _dataService.GetUserAsync(application.CandidateId);

            return Ok(new ApiResponse<Application>
            {
                Success = true,
                Message = "Application retrieved successfully",
                Data = application
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving application {ApplicationId}", id);
            return StatusCode(500, new ApiResponse<Application>
            {
                Success = false,
                Message = "An error occurred while retrieving the application",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost]
    [Route("/api/jobs/{jobId}/apply")]
    public async Task<ActionResult<ApiResponse<Application>>> ApplyToJob(string jobId, [FromBody] CreateApplicationRequest request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<Application>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole != "candidate")
            {
                return BadRequest(new ApiResponse<Application>
                {
                    Success = false,
                    Message = "Only candidates can apply to jobs"
                });
            }

            var job = await _dataService.GetJobAsync(jobId);
            if (job == null)
            {
                return NotFound(new ApiResponse<Application>
                {
                    Success = false,
                    Message = "Job not found"
                });
            }

            if (!job.IsActive)
            {
                return BadRequest(new ApiResponse<Application>
                {
                    Success = false,
                    Message = "Job is no longer active"
                });
            }

            // Check if user already applied
            var existingApplications = await _dataService.GetApplicationsAsync(jobId: jobId, candidateId: userId);
            if (existingApplications.Any())
            {
                return BadRequest(new ApiResponse<Application>
                {
                    Success = false,
                    Message = "You have already applied to this job"
                });
            }

            var application = new Application
            {
                JobId = jobId,
                CandidateId = userId,
                CoverLetter = request.CoverLetter,
                ResumeUrl = request.ResumeUrl,
                Status = ApplicationStatus.Applied
            };

            var createdApplication = await _dataService.CreateApplicationAsync(application);
            createdApplication.Job = job;

            return CreatedAtAction(nameof(GetApplication), new { id = createdApplication.Id }, new ApiResponse<Application>
            {
                Success = true,
                Message = "Application submitted successfully",
                Data = createdApplication
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error applying to job {JobId}", jobId);
            return StatusCode(500, new ApiResponse<Application>
            {
                Success = false,
                Message = "An error occurred while submitting your application",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<Application>>> UpdateApplication(string id, [FromBody] UpdateApplicationStatusRequest request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<Application>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            var application = await _dataService.GetApplicationAsync(id);
            if (application == null)
            {
                return NotFound(new ApiResponse<Application>
                {
                    Success = false,
                    Message = "Application not found"
                });
            }

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Only employers can update application status
            if (userRole != "employer")
            {
                return BadRequest(new ApiResponse<Application>
                {
                    Success = false,
                    Message = "Only employers can update application status"
                });
            }

            // Check if employer owns the job
            var job = await _dataService.GetJobAsync(application.JobId);
            if (job == null || job.EmployerId != userId)
            {
                return Forbid();
            }

            application.Status = request.Status;
            var updatedApplication = await _dataService.UpdateApplicationAsync(application);

            // Populate related data
            updatedApplication.Job = job;
            updatedApplication.Candidate = await _dataService.GetUserAsync(application.CandidateId);

            return Ok(new ApiResponse<Application>
            {
                Success = true,
                Message = "Application status updated successfully",
                Data = updatedApplication
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating application {ApplicationId}", id);
            return StatusCode(500, new ApiResponse<Application>
            {
                Success = false,
                Message = "An error occurred while updating the application",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteApplication(string id)
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

            var application = await _dataService.GetApplicationAsync(id);
            if (application == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Application not found"
                });
            }

            // Only the candidate who applied can delete their application
            if (application.CandidateId != userId)
            {
                return Forbid();
            }

            var deleted = await _dataService.DeleteApplicationAsync(id);
            if (!deleted)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to delete application"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Application deleted successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting application {ApplicationId}", id);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while deleting the application",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}
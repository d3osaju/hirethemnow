using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireThemNoW.Server.Services;
using HireThemNoW.Server.Models;
using System.Security.Claims;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/resume/analysis")]
[Authorize]
public class ResumeAnalysisController : ControllerBase
{
    private readonly IResumeAnalysisService _resumeAnalysisService;
    private readonly ILogger<ResumeAnalysisController> _logger;

    public ResumeAnalysisController(
        IResumeAnalysisService resumeAnalysisService,
        ILogger<ResumeAnalysisController> logger)
    {
        _resumeAnalysisService = resumeAnalysisService;
        _logger = logger;
    }

    /// <summary>
    /// Get the status of the latest resume analysis for the current user
    /// </summary>
    /// <returns>Analysis status information</returns>
    [HttpGet("status")]
    public async Task<ActionResult<ApiResponse<AnalysisStatusDto>>> GetAnalysisStatus()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        try
        {
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("Unauthorized access attempt to analysis status endpoint");
                return Unauthorized(new ApiResponse<AnalysisStatusDto>
                {
                    Success = false,
                    Message = "Authentication required. Please log in."
                });
            }

            _logger.LogInformation("Getting analysis status for user {UserId}", userId);

            var analysis = await _resumeAnalysisService.GetLatestAnalysisAsync(userId);

            if (analysis == null)
            {
                _logger.LogInformation("No analysis found for user {UserId}", userId);
                return NotFound(new ApiResponse<AnalysisStatusDto>
                {
                    Success = false,
                    Message = "No resume analysis found. Please upload a resume first."
                });
            }

            var statusDto = new AnalysisStatusDto
            {
                Status = analysis.Status,
                OverallScore = analysis.AtsOverallScore,
                CompletedAt = analysis.Status == "completed" ? analysis.ProcessedAt : null,
                ErrorMessage = analysis.AnalysisError
            };

            // Set appropriate message based on status
            statusDto.Message = analysis.Status switch
            {
                "waiting_for_parsing" => "Your resume is being parsed. Analysis will begin automatically once parsing is complete.",
                "processing" => "Analyzing your resume for ATS compatibility. This usually takes 10-15 seconds.",
                "completed" => $"Analysis completed successfully! Your ATS score is {analysis.AtsOverallScore}/100.",
                "failed" => "Analysis failed. Please try again or contact support if the issue persists.",
                _ => "Analysis status unknown."
            };

            // Return appropriate HTTP status code based on analysis status
            var httpStatusCode = analysis.Status switch
            {
                "waiting_for_parsing" or "processing" => 202, // Accepted - still processing
                "completed" => 200, // OK - completed successfully
                "failed" => 200, // OK but with error details in response
                _ => 200
            };

            _logger.LogInformation("Analysis status for user {UserId}: {Status}", userId, analysis.Status);

            return StatusCode(httpStatusCode, new ApiResponse<AnalysisStatusDto>
            {
                Success = analysis.Status != "failed",
                Message = "Analysis status retrieved successfully",
                Data = statusDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving analysis status for user {UserId}", userId);
            return StatusCode(500, new ApiResponse<AnalysisStatusDto>
            {
                Success = false,
                Message = "An error occurred while retrieving analysis status. Please try again.",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Get the full results of the latest resume analysis for the current user
    /// </summary>
    /// <returns>Complete analysis results if available</returns>
    [HttpGet("results")]
    public async Task<ActionResult<ApiResponse<ResumeAnalysisResultDto>>> GetAnalysisResults()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        try
        {
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("Unauthorized access attempt to analysis results endpoint");
                return Unauthorized(new ApiResponse<ResumeAnalysisResultDto>
                {
                    Success = false,
                    Message = "Authentication required. Please log in."
                });
            }

            _logger.LogInformation("Getting analysis results for user {UserId}", userId);

            var analysis = await _resumeAnalysisService.GetLatestAnalysisAsync(userId);

            if (analysis == null)
            {
                _logger.LogInformation("No analysis found for user {UserId}", userId);
                return NotFound(new ApiResponse<ResumeAnalysisResultDto>
                {
                    Success = false,
                    Message = "No resume analysis found. Please upload a resume first."
                });
            }

            // If analysis is still processing, return 202 Accepted with status message
            if (analysis.Status == "waiting_for_parsing" || analysis.Status == "processing")
            {
                var statusMessage = analysis.Status == "waiting_for_parsing" 
                    ? "Your resume is being parsed. Analysis will begin automatically once parsing is complete."
                    : "Your resume is being analyzed for ATS compatibility. Please check back in a few moments.";

                _logger.LogInformation("Analysis still processing for user {UserId}, status: {Status}", userId, analysis.Status);

                return StatusCode(202, new ApiResponse<ResumeAnalysisResultDto>
                {
                    Success = true,
                    Message = statusMessage,
                    Data = null
                });
            }

            // If analysis failed, return error details
            if (analysis.Status == "failed")
            {
                _logger.LogWarning("Analysis failed for user {UserId}: {Error}", userId, analysis.AnalysisError);
                return Ok(new ApiResponse<ResumeAnalysisResultDto>
                {
                    Success = false,
                    Message = "Resume analysis failed. Please try again or contact support if the issue persists.",
                    Data = null,
                    Errors = new List<string> { analysis.AnalysisError ?? "Analysis failed for unknown reason" }
                });
            }

            // Analysis completed successfully - convert to DTO with parsed JSON fields
            var resultDto = ResumeAnalysisMapper.ToResultDto(analysis);

            _logger.LogInformation("Returning completed analysis results for user {UserId}, score: {Score}", 
                userId, analysis.AtsOverallScore);

            return Ok(new ApiResponse<ResumeAnalysisResultDto>
            {
                Success = true,
                Message = $"Analysis completed successfully! Your ATS score is {analysis.AtsOverallScore}/100.",
                Data = resultDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving analysis results for user {UserId}", userId);
            return StatusCode(500, new ApiResponse<ResumeAnalysisResultDto>
            {
                Success = false,
                Message = "An error occurred while retrieving analysis results. Please try again.",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Retry the analysis for the current user's latest resume
    /// </summary>
    /// <returns>Success message if retry was initiated</returns>
    [HttpPost("retry")]
    public async Task<ActionResult<ApiResponse<string>>> RetryAnalysis()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        try
        {
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("Unauthorized access attempt to analysis retry endpoint");
                return Unauthorized(new ApiResponse<string>
                {
                    Success = false,
                    Message = "Authentication required. Please log in."
                });
            }

            _logger.LogInformation("Retrying analysis for user {UserId}", userId);

            var retrySuccessful = await _resumeAnalysisService.RetryAnalysisAsync(userId);

            if (!retrySuccessful)
            {
                _logger.LogWarning("No analysis found to retry for user {UserId}", userId);
                return NotFound(new ApiResponse<string>
                {
                    Success = false,
                    Message = "No resume analysis found to retry. Please upload a resume first."
                });
            }

            _logger.LogInformation("Analysis retry initiated successfully for user {UserId}", userId);

            return Ok(new ApiResponse<string>
            {
                Success = true,
                Message = "Analysis retry initiated successfully. Your resume will be re-analyzed shortly.",
                Data = "Retry initiated"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrying analysis for user {UserId}", userId);
            return StatusCode(500, new ApiResponse<string>
            {
                Success = false,
                Message = "An error occurred while retrying the analysis. Please try again.",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}
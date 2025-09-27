using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireThemNoW.Server.Models;
using HireThemNoW.Server.Services;
using System.Security.Claims;
using System.Text.Json;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ResumeController : ControllerBase
{
    private readonly IDataService _dataService;
    private readonly ILogger<ResumeController> _logger;
    private readonly IWebHostEnvironment _environment;

    public ResumeController(IDataService dataService, ILogger<ResumeController> logger, IWebHostEnvironment environment)
    {
        _dataService = dataService;
        _logger = logger;
        _environment = environment;
    }

    [HttpPost("upload")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<ResumeAnalysis>>> UploadResume(IFormFile resume)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<ResumeAnalysis>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            if (resume == null || resume.Length == 0)
            {
                return BadRequest(new ApiResponse<ResumeAnalysis>
                {
                    Success = false,
                    Message = "No file uploaded"
                });
            }

            // Validate file type
            var allowedExtensions = new[] { ".pdf", ".doc", ".docx" };
            var fileExtension = Path.GetExtension(resume.FileName).ToLower();
            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest(new ApiResponse<ResumeAnalysis>
                {
                    Success = false,
                    Message = "Only PDF and Word documents are allowed"
                });
            }

            // Create upload directory
            var uploadsPath = Path.Combine(_environment.ContentRootPath, "uploads", "resumes");
            Directory.CreateDirectory(uploadsPath);

            // Generate unique filename
            var fileName = $"{userId}_{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadsPath, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await resume.CopyToAsync(stream);
            }

            // Get user info for N8N
            var user = await _dataService.GetUserAsync(userId);
            if (user == null)
            {
                return NotFound(new ApiResponse<ResumeAnalysis>
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            // Create resume analysis record
            var resumeAnalysis = new ResumeAnalysis
            {
                UserId = userId,
                ResumeFileName = resume.FileName,
                ResumeFilePath = filePath,
                AnalysisStatus = "pending"
            };

            var createdAnalysis = await _dataService.CreateResumeAnalysisAsync(resumeAnalysis);

            // Trigger N8N workflow for document analysis and auto cold email campaign
            await TriggerResumeAnalysisWorkflow(new ResumeAnalysisRequest
            {
                UserId = userId,
                UserEmail = user.Email,
                ResumeFilePath = filePath,
                ResumeFileName = resume.FileName
            });

            // Auto-start background campaign (this will be handled by N8N after analysis)
            _logger.LogInformation("Resume uploaded for user {UserId}. Auto-campaign will start after analysis.", userId);

            return Ok(new ApiResponse<ResumeAnalysis>
            {
                Success = true,
                Message = "Resume uploaded successfully. Analysis in progress.",
                Data = createdAnalysis
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading resume");
            return StatusCode(500, new ApiResponse<ResumeAnalysis>
            {
                Success = false,
                Message = "An error occurred while uploading the resume",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("analysis")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<ResumeAnalysis>>> GetResumeAnalysis()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<ResumeAnalysis>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            var analysis = await _dataService.GetResumeAnalysisByUserIdAsync(userId);
            if (analysis == null)
            {
                return NotFound(new ApiResponse<ResumeAnalysis>
                {
                    Success = false,
                    Message = "No resume analysis found"
                });
            }

            return Ok(new ApiResponse<ResumeAnalysis>
            {
                Success = true,
                Message = "Resume analysis retrieved successfully",
                Data = analysis
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving resume analysis");
            return StatusCode(500, new ApiResponse<ResumeAnalysis>
            {
                Success = false,
                Message = "An error occurred while retrieving the analysis",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    // N8N Webhook endpoint to receive analysis results
    [HttpPost("analysis/result")]
    public async Task<ActionResult<ApiResponse<object>>> ReceiveAnalysisResult([FromBody] ResumeAnalysisResult result)
    {
        try
        {
            var analysis = await _dataService.GetResumeAnalysisByUserIdAsync(result.UserId);
            if (analysis == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Resume analysis not found"
                });
            }

            // Update analysis with results
            analysis.AnalysisJson = JsonSerializer.Serialize(result.Analysis);
            analysis.Skills = result.Analysis.Skills;
            analysis.WorkExperience = result.Analysis.WorkExperience;
            analysis.Education = result.Analysis.Education;
            analysis.Summary = result.Analysis.Summary;
            analysis.AnalysisStatus = "completed";

            // Store cold email templates
            if (result.ColdEmailTemplates.Count >= 1)
                analysis.ColdEmailTemplate1 = result.ColdEmailTemplates[0];
            if (result.ColdEmailTemplates.Count >= 2)
                analysis.ColdEmailTemplate2 = result.ColdEmailTemplates[1];
            if (result.ColdEmailTemplates.Count >= 3)
                analysis.ColdEmailTemplate3 = result.ColdEmailTemplates[2];
            if (result.ColdEmailTemplates.Count >= 4)
                analysis.ColdEmailTemplate4 = result.ColdEmailTemplates[3];
            if (result.ColdEmailTemplates.Count >= 5)
                analysis.ColdEmailTemplate5 = result.ColdEmailTemplates[4];

            await _dataService.UpdateResumeAnalysisAsync(analysis);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Analysis result processed successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing analysis result");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while processing the result",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("analysis/error")]
    public Task<ActionResult<ApiResponse<object>>> ReceiveAnalysisError([FromBody] object errorData)
    {
        try
        {
            // Handle analysis errors from N8N
            _logger.LogError("Resume analysis error: {ErrorData}", JsonSerializer.Serialize(errorData));

            return Task.FromResult<ActionResult<ApiResponse<object>>>(Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Error logged successfully"
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing analysis error");
            return Task.FromResult<ActionResult<ApiResponse<object>>>(StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while processing the error",
                Errors = new List<string> { ex.Message }
            }));
        }
    }

    private async Task TriggerResumeAnalysisWorkflow(ResumeAnalysisRequest request)
    {
        try
        {
            // TODO: Replace with your actual N8N webhook URL
            var n8nWebhookUrl = "https://your-n8n-instance.com/webhook/resume-analysis";

            using var httpClient = new HttpClient();
            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await httpClient.PostAsync(n8nWebhookUrl, content);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Failed to trigger N8N workflow: {StatusCode} {ReasonPhrase}",
                    response.StatusCode, response.ReasonPhrase);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error triggering N8N workflow");
        }
    }
}
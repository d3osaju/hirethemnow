using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireThemNoW.Server.Models;
using HireThemNoW.Server.Services;
using System.Security.Claims;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ResumeController : ControllerBase
{
    private readonly IDataService _dataService;
    private readonly ILogger<ResumeController> _logger;
    private readonly IS3Service _s3Service;

    public ResumeController(IDataService dataService, ILogger<ResumeController> logger, IS3Service s3Service)
    {
        _dataService = dataService;
        _logger = logger;
        _s3Service = s3Service;
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

            // Validate file size (2MB max)
            const long maxFileSize = 2 * 1024 * 1024; // 2MB
            if (resume.Length > maxFileSize)
            {
                return BadRequest(new ApiResponse<ResumeAnalysis>
                {
                    Success = false,
                    Message = "File size must be less than 2MB"
                });
            }

            // Upload to S3
            string s3FileKey;
            try
            {
                using (var stream = resume.OpenReadStream())
                {
                    s3FileKey = await _s3Service.UploadFileAsync(stream, resume.FileName, resume.ContentType);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload resume to S3 for user {UserId}", userId);
                return StatusCode(500, new ApiResponse<ResumeAnalysis>
                {
                    Success = false,
                    Message = "Failed to upload resume. Please try again.",
                    Errors = new List<string> { "Storage upload failed" }
                });
            }

            // Create resume analysis record
            var resumeAnalysis = new ResumeAnalysis
            {
                UserId = userId,
                ResumeFileName = resume.FileName,
                ResumeFilePath = s3FileKey,
                AnalysisStatus = "uploaded"
            };

            var createdAnalysis = await _dataService.CreateResumeAnalysisAsync(resumeAnalysis);

            _logger.LogInformation("Resume uploaded successfully for user {UserId}", userId);

            return Ok(new ApiResponse<ResumeAnalysis>
            {
                Success = true,
                Message = "Resume uploaded successfully.",
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
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "No resume found",
                    Data = new
                    {
                        hasResume = false,
                        needsUpload = true,
                        uploadEndpoint = "/api/resume/upload",
                        supportedFormats = new[] { ".pdf", ".doc", ".docx" },
                        maxFileSize = "2MB",
                        message = "Please upload your resume to get started"
                    }
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Resume analysis retrieved successfully",
                Data = new
                {
                    hasResume = true,
                    needsUpload = false,
                    analysis = analysis,
                    downloadEndpoint = "/api/resume/download",
                    canReupload = true,
                    message = "Resume found and analyzed"
                }
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

    [HttpGet("download")]
    [Authorize]
    public async Task<IActionResult> DownloadResume()
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

            var analysis = await _dataService.GetResumeAnalysisByUserIdAsync(userId);
            if (analysis == null)
            {
                return Ok(new ApiResponse<object>
                {
                    Success = false,
                    Message = "No resume available for download",
                    Data = new
                    {
                        hasResume = false,
                        needsUpload = true,
                        uploadEndpoint = "/api/resume/upload",
                        supportedFormats = new[] { ".pdf", ".doc", ".docx" },
                        maxFileSize = "2MB",
                        action = "upload_required",
                        message = "Please upload your resume first to enable download"
                    }
                });
            }

            // Download file from S3
            try
            {
                var fileStream = await _s3Service.DownloadFileAsync(analysis.ResumeFilePath);

                // Determine content type based on file extension
                var fileExtension = Path.GetExtension(analysis.ResumeFileName).ToLower();
                var contentType = fileExtension switch
                {
                    ".pdf" => "application/pdf",
                    ".doc" => "application/msword",
                    ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    _ => "application/octet-stream"
                };

                return File(fileStream, contentType, analysis.ResumeFileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to download resume from S3 for user {UserId}", userId);
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to download resume. Please try again.",
                    Errors = new List<string> { "Storage download failed" }
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading resume");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while downloading the resume",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("status")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> GetResumeStatus()
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

            var analysis = await _dataService.GetResumeAnalysisByUserIdAsync(userId);

            if (analysis == null)
            {
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Resume status checked",
                    Data = new
                    {
                        hasResume = false,
                        needsUpload = true,
                        status = "no_resume",
                        uploadEndpoint = "/api/resume/upload",
                        supportedFormats = new[] { ".pdf", ".doc", ".docx" },
                        maxFileSize = "2MB",
                        instructions = new[]
                        {
                            "Click 'Upload Resume' to get started",
                            "Supported formats: PDF, DOC, DOCX",
                            "Maximum file size: 2MB"
                        }
                    }
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Resume status checked",
                Data = new
                {
                    hasResume = true,
                    needsUpload = false,
                    status = "resume_available",
                    fileName = analysis.ResumeFileName,
                    uploadedAt = analysis.AnalyzedAt,
                    analysisStatus = analysis.AnalysisStatus,
                    downloadEndpoint = "/api/resume/download",
                    canReupload = true,
                    actions = new[]
                    {
                        "View resume analysis",
                        "Download resume file",
                        "Upload new resume (replace current)"
                    }
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking resume status");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while checking resume status",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}
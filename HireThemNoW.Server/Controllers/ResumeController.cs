using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireThemNoW.Server.Services;
using HireThemNoW.Server.Models;
using System.Security.Claims;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ResumeController : ControllerBase
{
    private readonly IS3Service _s3Service;
    private readonly IDataService _dataService;
    private readonly IBedrockAgentService _bedrockService;
    private readonly IResumeParsingService _resumeParsingService;
    private readonly IResumeAnalysisService _resumeAnalysisService;
    private readonly IConfiguration _configuration;

    public ResumeController(IS3Service s3Service, IDataService dataService, IBedrockAgentService bedrockService, IResumeParsingService resumeParsingService, IResumeAnalysisService resumeAnalysisService, IConfiguration configuration)
    {
        _s3Service = s3Service;
        _dataService = dataService;
        _bedrockService = bedrockService;
        _resumeParsingService = resumeParsingService;
        _resumeAnalysisService = resumeAnalysisService;
        _configuration = configuration;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadResume(IFormFile resume)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        try
        {
            if (resume == null || resume.Length == 0)
            {
                return BadRequest(new { success = false, message = "No file provided. Please select a resume file to upload." });
            }

            // Validate file type
            var allowedExtensions = new[] { ".pdf", ".doc", ".docx" };
            var extension = Path.GetExtension(resume.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new { 
                    success = false, 
                    message = "Invalid file type. Only PDF, DOC, and DOCX files are supported." 
                });
            }

            // Validate file size (5MB max)
            const long maxFileSize = 5 * 1024 * 1024;
            if (resume.Length > maxFileSize)
            {
                return BadRequest(new { 
                    success = false, 
                    message = $"File size exceeds the maximum limit of 5MB. Your file is {resume.Length / (1024.0 * 1024.0):F2}MB." 
                });
            }

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "Authentication required. Please log in to upload your resume." });
            }

            // Upload to S3 (S3Service will generate the key)
            string s3Key;
            try
            {
                s3Key = await _s3Service.UploadFileAsync(resume.OpenReadStream(), resume.FileName, resume.ContentType);
            }
            catch (Exception)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to upload file to storage. Please try again.",
                    error = "Storage service error"
                });
            }

            // Update user's resume URL
            try
            {
                var user = await _dataService.GetUserAsync(userId);
                if (user == null)
                {
                    return NotFound(new { success = false, message = "User account not found. Please contact support." });
                }

                user.ResumeUrl = s3Key;
                await _dataService.UpdateUserAsync(user);
            }
            catch (Exception)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to update user profile. Please try again.",
                    error = "Database error"
                });
            }

            // Create pending analysis record for AI processing
            try
            {
                var bucketName = _configuration["AWS:S3:BucketName"] ?? "hirethemnow-files";
                var s3Url = $"s3://{bucketName}/{s3Key}";
                await _bedrockService.CreatePendingAnalysisAsync(userId, s3Url);
            }
            catch (Exception)
            {
                // Log but don't fail the upload - analysis can be retried
            }

            // Create pending resume content record for background processing
            var contentType = extension.TrimStart('.');
            var resumeContent = new ResumeContent
            {
                UserId = userId,
                S3Key = s3Key,
                FileName = resume.FileName,
                ContentType = contentType,
                FileSizeBytes = resume.Length,
                ParsingStatus = "pending",
                ParsedContent = string.Empty,
                UploadedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            ResumeAnalysis? resumeAnalysis = null;
            try
            {
                resumeContent = await _dataService.SaveResumeContentAsync(resumeContent);
                
                // Create ResumeAnalysis record with status "waiting_for_parsing"
                resumeAnalysis = new ResumeAnalysis
                {
                    UserId = userId,
                    ResumeContentId = resumeContent.Id,
                    Status = "waiting_for_parsing",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    ProcessedAt = DateTime.UtcNow
                };
                
                resumeAnalysis = await _dataService.SaveResumeAnalysisAsync(resumeAnalysis);
            }
            catch (Exception)
            {
                // Log but don't fail - background service will pick it up if user record exists
            }

            return Ok(new {
                success = true,
                message = "Resume uploaded successfully! We're parsing your resume in the background.",
                data = new { 
                    resumeUrl = s3Key, 
                    fileName = resume.FileName, 
                    status = "pending",
                    parsingStatus = "pending",
                    parsingId = resumeContent.Id,
                    analysisId = resumeAnalysis?.Id,
                    analysisStatus = "waiting_for_parsing"
                }
            });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(500, new { 
                success = false, 
                message = ex.Message,
                error = "Operation failed"
            });
        }
        catch (Exception)
        {
            return StatusCode(500, new { 
                success = false, 
                message = "An unexpected error occurred while uploading your resume. Please try again or contact support if the issue persists.",
                error = "Unexpected error"
            });
        }
    }

    [HttpGet("download")]
    public async Task<IActionResult> DownloadResume()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        try
        {
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "Authentication required. Please log in." });
            }

            var user = await _dataService.GetUserAsync(userId);
            if (user == null || string.IsNullOrEmpty(user.ResumeUrl))
            {
                return NotFound(new { 
                    success = false, 
                    message = "No resume found. Please upload a resume first.", 
                    needsUpload = true 
                });
            }

            // S3 key is stored directly in ResumeUrl (not a full URL)
            var s3Key = user.ResumeUrl;

            // Get file from S3
            Stream fileStream;
            try
            {
                fileStream = await _s3Service.DownloadFileAsync(s3Key);
            }
            catch (Exception)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve resume file from storage. Please try again.",
                    error = "Storage service error"
                });
            }

            var fileName = Path.GetFileName(s3Key);
            var contentType = GetContentType(fileName);

            return File(fileStream, contentType, fileName);
        }
        catch (Exception)
        {
            return StatusCode(500, new { 
                success = false, 
                message = "Failed to download resume. Please try again or contact support.",
                error = "Unexpected error"
            });
        }
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetResumeStatus()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        try
        {
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "Authentication required. Please log in." });
            }

            var user = await _dataService.GetUserAsync(userId);
            if (user == null)
            {
                return NotFound(new { success = false, message = "User account not found. Please contact support." });
            }

            var hasResume = !string.IsNullOrEmpty(user.ResumeUrl);

            return Ok(new {
                success = true,
                message = hasResume ? "Resume found" : "No resume uploaded",
                data = new {
                    hasResume,
                    needsUpload = !hasResume,
                    status = hasResume ? "uploaded" : "none",
                    resumeUrl = user.ResumeUrl
                }
            });
        }
        catch (Exception)
        {
            return StatusCode(500, new { 
                success = false, 
                message = "Failed to retrieve resume status. Please try again.",
                error = "Unexpected error"
            });
        }
    }

    [HttpGet("parsing-status")]
    public async Task<IActionResult> GetParsingStatus()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        try
        {
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "Authentication required. Please log in." });
            }

            var resumeContent = await _resumeParsingService.GetLatestResumeContentAsync(userId);

            if (resumeContent == null)
            {
                return NotFound(new { 
                    success = false, 
                    message = "No resume found. Please upload a resume first.", 
                    needsUpload = true 
                });
            }

            return Ok(new {
                success = true,
                message = "Parsing status retrieved successfully",
                data = new {
                    id = resumeContent.Id,
                    fileName = resumeContent.FileName,
                    status = resumeContent.ParsingStatus,
                    uploadedAt = resumeContent.UploadedAt,
                    parsedAt = resumeContent.ParsedAt,
                    error = resumeContent.ParsingError
                }
            });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(500, new { 
                success = false, 
                message = ex.Message,
                error = "Operation failed"
            });
        }
        catch (Exception)
        {
            return StatusCode(500, new { 
                success = false, 
                message = "Failed to retrieve parsing status. Please try again.",
                error = "Unexpected error"
            });
        }
    }

    [HttpGet("content/history")]
    public async Task<IActionResult> GetResumeContentHistory()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        try
        {
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "Authentication required. Please log in." });
            }

            var history = await _resumeParsingService.GetResumeHistoryAsync(userId);

            return Ok(new {
                success = true,
                message = history.Count > 0 
                    ? $"Retrieved {history.Count} resume version(s)" 
                    : "No resume history found",
                data = history.Select(rc => new {
                    id = rc.Id,
                    fileName = rc.FileName,
                    contentType = rc.ContentType,
                    status = rc.ParsingStatus,
                    uploadedAt = rc.UploadedAt,
                    parsedAt = rc.ParsedAt,
                    fileSizeBytes = rc.FileSizeBytes,
                    error = rc.ParsingError
                }).ToList()
            });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(500, new { 
                success = false, 
                message = ex.Message,
                error = "Operation failed"
            });
        }
        catch (Exception)
        {
            return StatusCode(500, new { 
                success = false, 
                message = "Failed to retrieve resume history. Please try again.",
                error = "Unexpected error"
            });
        }
    }

    [HttpGet("content")]
    public async Task<IActionResult> GetResumeContent()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        try
        {
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "Authentication required. Please log in." });
            }

            var resumeContent = await _resumeParsingService.GetLatestResumeContentAsync(userId);

            if (resumeContent == null)
            {
                return NotFound(new { 
                    success = false, 
                    message = "No resume found. Please upload a resume to get started.", 
                    needsUpload = true 
                });
            }

            // Check parsing status
            if (resumeContent.ParsingStatus == "processing" || resumeContent.ParsingStatus == "pending")
            {
                return StatusCode(202, new { 
                    success = true, 
                    message = "Your resume is being parsed. This usually takes a few seconds.",
                    data = new {
                        status = resumeContent.ParsingStatus,
                        uploadedAt = resumeContent.UploadedAt,
                        fileName = resumeContent.FileName
                    }
                });
            }

            if (resumeContent.ParsingStatus == "failed")
            {
                return Ok(new { 
                    success = false, 
                    message = "Resume parsing failed. Please try uploading your resume again.",
                    data = new {
                        status = resumeContent.ParsingStatus,
                        error = resumeContent.ParsingError ?? "An error occurred during parsing",
                        uploadedAt = resumeContent.UploadedAt,
                        fileName = resumeContent.FileName
                    }
                });
            }

            // Return parsed content
            return Ok(new {
                success = true,
                message = "Resume content retrieved successfully",
                data = new {
                    id = resumeContent.Id,
                    fileName = resumeContent.FileName,
                    contentType = resumeContent.ContentType,
                    parsedContent = resumeContent.ParsedContent,
                    textContent = resumeContent.TextContent,
                    status = resumeContent.ParsingStatus,
                    uploadedAt = resumeContent.UploadedAt,
                    parsedAt = resumeContent.ParsedAt
                }
            });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(500, new { 
                success = false, 
                message = ex.Message,
                error = "Operation failed"
            });
        }
        catch (Exception)
        {
            return StatusCode(500, new { 
                success = false, 
                message = "Failed to retrieve resume content. Please try again.",
                error = "Unexpected error"
            });
        }
    }

    private static string GetContentType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return extension switch
        {
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            _ => "application/octet-stream"
        };
    }
}
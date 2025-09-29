using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireThemNoW.Server.Services;
using System.Security.Claims;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ResumeController : ControllerBase
{
    private readonly IS3Service _s3Service;
    private readonly IDataService _dataService;

    public ResumeController(IS3Service s3Service, IDataService dataService)
    {
        _s3Service = s3Service;
        _dataService = dataService;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadResume(IFormFile resume)
    {
        try
        {
            if (resume == null || resume.Length == 0)
            {
                return BadRequest(new { success = false, message = "No file provided" });
            }

            // Validate file type
            var allowedExtensions = new[] { ".pdf", ".doc", ".docx" };
            var extension = Path.GetExtension(resume.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new { success = false, message = "Only PDF, DOC, and DOCX files are allowed" });
            }

            // Validate file size (5MB max)
            if (resume.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new { success = false, message = "File size must be less than 5MB" });
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "User not found" });
            }

            // Upload to S3 (S3Service will generate the key)
            var s3Key = await _s3Service.UploadFileAsync(resume.OpenReadStream(), resume.FileName, resume.ContentType);

            // Update user's resume URL
            var user = await _dataService.GetUserAsync(userId);
            if (user == null)
            {
                return NotFound(new { success = false, message = "User not found" });
            }

            user.ResumeUrl = s3Key;
            await _dataService.UpdateUserAsync(user);

            return Ok(new {
                success = true,
                message = "Resume uploaded successfully",
                data = new { resumeUrl = s3Key, fileName = resume.FileName }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to upload resume", error = ex.Message });
        }
    }

    [HttpGet("download")]
    public async Task<IActionResult> DownloadResume()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "User not found" });
            }

            var user = await _dataService.GetUserAsync(userId);
            if (user == null || string.IsNullOrEmpty(user.ResumeUrl))
            {
                return NotFound(new { success = false, message = "No resume found", needsUpload = true });
            }

            // S3 key is stored directly in ResumeUrl (not a full URL)
            var s3Key = user.ResumeUrl;

            // Get file from S3
            var fileStream = await _s3Service.DownloadFileAsync(s3Key);
            var fileName = Path.GetFileName(s3Key);
            var contentType = GetContentType(fileName);

            return File(fileStream, contentType, fileName);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to download resume", error = ex.Message });
        }
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetResumeStatus()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "User not found" });
            }

            var user = await _dataService.GetUserAsync(userId);
            if (user == null)
            {
                return NotFound(new { success = false, message = "User not found" });
            }

            var hasResume = !string.IsNullOrEmpty(user.ResumeUrl);

            return Ok(new {
                success = true,
                data = new {
                    hasResume,
                    needsUpload = !hasResume,
                    status = hasResume ? "uploaded" : "none",
                    resumeUrl = user.ResumeUrl
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Failed to get resume status", error = ex.Message });
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
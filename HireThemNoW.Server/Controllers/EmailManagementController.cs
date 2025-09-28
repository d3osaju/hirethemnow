using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireThemNoW.Server.Models;
using HireThemNoW.Server.Services;
using System.Security.Claims;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmailManagementController : ControllerBase
{
    private readonly IDataService _dataService;

    public EmailManagementController(IDataService dataService)
    {
        _dataService = dataService;
    }

    // EmailSent endpoints
    [HttpGet("sent")]
    public async Task<ActionResult<List<EmailSent>>> GetEmailsSent([FromQuery] string? campaignId = null)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var emails = await _dataService.GetEmailsSentAsync(userId, campaignId);
            return Ok(new { message = "Sent emails retrieved successfully", data = emails });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    [HttpGet("sent/{id}")]
    public async Task<ActionResult<EmailSent>> GetEmailSent(string id)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var email = await _dataService.GetEmailSentAsync(id);
            if (email == null)
            {
                return NotFound(new { message = "Email not found" });
            }

            // Verify ownership
            if (email.UserId != userId)
            {
                return Forbid();
            }

            return Ok(new { message = "Sent email retrieved successfully", data = email });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    [HttpPost("sent")]
    public async Task<ActionResult<EmailSent>> CreateEmailSent([FromBody] EmailSent emailSent)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Set the user ID
            emailSent.UserId = userId;

            // Validate required fields
            if (string.IsNullOrEmpty(emailSent.ToEmail) || string.IsNullOrEmpty(emailSent.Subject) || string.IsNullOrEmpty(emailSent.EmailContentHtml))
            {
                return BadRequest(new { message = "ToEmail, Subject, and EmailContentHtml are required" });
            }

            var createdEmail = await _dataService.CreateEmailSentAsync(emailSent);
            return CreatedAtAction(nameof(GetEmailSent), new { id = createdEmail.Id }, new { message = "Email sent record created successfully", data = createdEmail });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    [HttpPut("sent/{id}")]
    public async Task<ActionResult<EmailSent>> UpdateEmailSent(string id, [FromBody] EmailSent emailSent)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var existingEmail = await _dataService.GetEmailSentAsync(id);
            if (existingEmail == null)
            {
                return NotFound(new { message = "Email not found" });
            }

            // Verify ownership
            if (existingEmail.UserId != userId)
            {
                return Forbid();
            }

            emailSent.Id = id;
            emailSent.UserId = userId;

            var updatedEmail = await _dataService.UpdateEmailSentAsync(emailSent);
            return Ok(new { message = "Email sent record updated successfully", data = updatedEmail });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    [HttpDelete("sent/{id}")]
    public async Task<ActionResult> DeleteEmailSent(string id)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var existingEmail = await _dataService.GetEmailSentAsync(id);
            if (existingEmail == null)
            {
                return NotFound(new { message = "Email not found" });
            }

            // Verify ownership
            if (existingEmail.UserId != userId)
            {
                return Forbid();
            }

            var deleted = await _dataService.DeleteEmailSentAsync(id);
            if (deleted)
            {
                return Ok(new { message = "Email sent record deleted successfully" });
            }

            return StatusCode(500, new { message = "Failed to delete email record" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    // EmailReceived endpoints
    [HttpGet("received")]
    public async Task<ActionResult<List<EmailReceived>>> GetEmailsReceived([FromQuery] string? originalEmailId = null)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var emails = await _dataService.GetEmailsReceivedAsync(userId, originalEmailId);
            return Ok(new { message = "Received emails retrieved successfully", data = emails });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    [HttpGet("received/{id}")]
    public async Task<ActionResult<EmailReceived>> GetEmailReceived(string id)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var email = await _dataService.GetEmailReceivedAsync(id);
            if (email == null)
            {
                return NotFound(new { message = "Email not found" });
            }

            // Verify ownership
            if (email.UserId != userId)
            {
                return Forbid();
            }

            return Ok(new { message = "Received email retrieved successfully", data = email });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    [HttpPost("received")]
    public async Task<ActionResult<EmailReceived>> CreateEmailReceived([FromBody] EmailReceived emailReceived)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Set the user ID
            emailReceived.UserId = userId;

            // Validate required fields
            if (string.IsNullOrEmpty(emailReceived.FromEmail) || string.IsNullOrEmpty(emailReceived.Subject) || string.IsNullOrEmpty(emailReceived.EmailContentHtml))
            {
                return BadRequest(new { message = "FromEmail, Subject, and EmailContentHtml are required" });
            }

            var createdEmail = await _dataService.CreateEmailReceivedAsync(emailReceived);
            return CreatedAtAction(nameof(GetEmailReceived), new { id = createdEmail.Id }, new { message = "Email received record created successfully", data = createdEmail });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    [HttpPut("received/{id}")]
    public async Task<ActionResult<EmailReceived>> UpdateEmailReceived(string id, [FromBody] EmailReceived emailReceived)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var existingEmail = await _dataService.GetEmailReceivedAsync(id);
            if (existingEmail == null)
            {
                return NotFound(new { message = "Email not found" });
            }

            // Verify ownership
            if (existingEmail.UserId != userId)
            {
                return Forbid();
            }

            emailReceived.Id = id;
            emailReceived.UserId = userId;

            var updatedEmail = await _dataService.UpdateEmailReceivedAsync(emailReceived);
            return Ok(new { message = "Email received record updated successfully", data = updatedEmail });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    [HttpDelete("received/{id}")]
    public async Task<ActionResult> DeleteEmailReceived(string id)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var existingEmail = await _dataService.GetEmailReceivedAsync(id);
            if (existingEmail == null)
            {
                return NotFound(new { message = "Email not found" });
            }

            // Verify ownership
            if (existingEmail.UserId != userId)
            {
                return Forbid();
            }

            var deleted = await _dataService.DeleteEmailReceivedAsync(id);
            if (deleted)
            {
                return Ok(new { message = "Email received record deleted successfully" });
            }

            return StatusCode(500, new { message = "Failed to delete email record" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    // Bulk operations for n8n integration
    [HttpPost("bulk/sent")]
    public async Task<ActionResult> CreateBulkEmailsSent([FromBody] List<EmailSent> emails)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var results = new List<EmailSent>();
            foreach (var email in emails)
            {
                email.UserId = userId;
                var created = await _dataService.CreateEmailSentAsync(email);
                results.Add(created);
            }

            return Ok(new { message = $"{results.Count} email sent records created successfully", data = results });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    [HttpPost("bulk/received")]
    public async Task<ActionResult> CreateBulkEmailsReceived([FromBody] List<EmailReceived> emails)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var results = new List<EmailReceived>();
            foreach (var email in emails)
            {
                email.UserId = userId;
                var created = await _dataService.CreateEmailReceivedAsync(email);
                results.Add(created);
            }

            return Ok(new { message = $"{results.Count} email received records created successfully", data = results });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }
}
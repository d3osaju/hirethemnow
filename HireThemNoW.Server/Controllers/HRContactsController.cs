using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireThemNoW.Server.Models;
using HireThemNoW.Server.Services;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HRContactsController : ControllerBase
{
    private readonly IDataService _dataService;
    private readonly ILogger<HRContactsController> _logger;

    public HRContactsController(IDataService dataService, ILogger<HRContactsController> logger)
    {
        _dataService = dataService;
        _logger = logger;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<List<HRContact>>>> GetHRContacts(
        [FromQuery] string? industries = null,
        [FromQuery] string? skills = null)
    {
        try
        {
            var industriesList = !string.IsNullOrEmpty(industries)
                ? industries.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList()
                : null;

            var skillsList = !string.IsNullOrEmpty(skills)
                ? skills.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList()
                : null;

            var contacts = await _dataService.GetHRContactsAsync(industriesList, skillsList);

            return Ok(new ApiResponse<List<HRContact>>
            {
                Success = true,
                Message = "HR contacts retrieved successfully",
                Data = contacts
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving HR contacts");
            return StatusCode(500, new ApiResponse<List<HRContact>>
            {
                Success = false,
                Message = "An error occurred while retrieving HR contacts",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<HRContact>>> GetHRContact(string id)
    {
        try
        {
            var contact = await _dataService.GetHRContactAsync(id);
            if (contact == null)
            {
                return NotFound(new ApiResponse<HRContact>
                {
                    Success = false,
                    Message = "HR contact not found"
                });
            }

            return Ok(new ApiResponse<HRContact>
            {
                Success = true,
                Message = "HR contact retrieved successfully",
                Data = contact
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving HR contact {ContactId}", id);
            return StatusCode(500, new ApiResponse<HRContact>
            {
                Success = false,
                Message = "An error occurred while retrieving the HR contact",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    // N8N Webhook endpoint to receive scraped HR contacts
    [HttpPost("bulk")]
    public async Task<ActionResult<ApiResponse<List<HRContact>>>> CreateHRContacts([FromBody] HRContactRequest request)
    {
        try
        {
            var hrContacts = request.Contacts.Select(c => new HRContact
            {
                Email = c.Email,
                Name = c.Name,
                Company = c.Company,
                JobTitle = c.JobTitle,
                LinkedIn = c.LinkedIn,
                Industry = request.Industry,
                RelevantSkills = request.Skills,
                Source = c.Source,
                SourceUrl = c.SourceUrl
            }).ToList();

            var createdContacts = await _dataService.CreateHRContactsAsync(hrContacts);

            _logger.LogInformation("Created {Count} new HR contacts for industry: {Industry}",
                createdContacts.Count, request.Industry);

            return Ok(new ApiResponse<List<HRContact>>
            {
                Success = true,
                Message = $"Successfully created {createdContacts.Count} HR contacts",
                Data = createdContacts
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating HR contacts");
            return StatusCode(500, new ApiResponse<List<HRContact>>
            {
                Success = false,
                Message = "An error occurred while creating HR contacts",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<HRContact>>> UpdateHRContact(string id, [FromBody] HRContact contact)
    {
        try
        {
            var existingContact = await _dataService.GetHRContactAsync(id);
            if (existingContact == null)
            {
                return NotFound(new ApiResponse<HRContact>
                {
                    Success = false,
                    Message = "HR contact not found"
                });
            }

            contact.Id = id;
            var updatedContact = await _dataService.UpdateHRContactAsync(contact);

            return Ok(new ApiResponse<HRContact>
            {
                Success = true,
                Message = "HR contact updated successfully",
                Data = updatedContact
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating HR contact {ContactId}", id);
            return StatusCode(500, new ApiResponse<HRContact>
            {
                Success = false,
                Message = "An error occurred while updating the HR contact",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> DeleteHRContact(string id)
    {
        try
        {
            var deleted = await _dataService.DeleteHRContactAsync(id);
            if (!deleted)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "HR contact not found"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "HR contact deleted successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting HR contact {ContactId}", id);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while deleting the HR contact",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("stats")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> GetHRContactStats()
    {
        try
        {
            var allContacts = await _dataService.GetHRContactsAsync();

            var stats = new
            {
                TotalContacts = allContacts.Count,
                Industries = allContacts.GroupBy(c => c.Industry)
                    .Select(g => new { Industry = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .ToList(),
                TopSkills = allContacts
                    .SelectMany(c => c.RelevantSkills)
                    .GroupBy(s => s, StringComparer.OrdinalIgnoreCase)
                    .Select(g => new { Skill = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .Take(10)
                    .ToList(),
                RecentlyAdded = allContacts.Where(c => c.CreatedAt > DateTime.UtcNow.AddDays(-7)).Count()
            };

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "HR contact statistics retrieved successfully",
                Data = stats
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving HR contact statistics");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while retrieving statistics",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}
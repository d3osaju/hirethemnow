using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireThemNoW.Server.Models;
using HireThemNoW.Server.Services;
using System.Security.Claims;
using System.Text.Json;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ColdEmailController : ControllerBase
{
    private readonly IDataService _dataService;
    private readonly ILogger<ColdEmailController> _logger;

    public ColdEmailController(IDataService dataService, ILogger<ColdEmailController> logger)
    {
        _dataService = dataService;
        _logger = logger;
    }

    [HttpGet("campaigns")]
    public async Task<ActionResult<ApiResponse<List<ColdEmailCampaign>>>> GetCampaigns()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<List<ColdEmailCampaign>>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            var campaigns = await _dataService.GetColdEmailCampaignsAsync(userId);

            return Ok(new ApiResponse<List<ColdEmailCampaign>>
            {
                Success = true,
                Message = "Cold email campaigns retrieved successfully",
                Data = campaigns
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving cold email campaigns");
            return StatusCode(500, new ApiResponse<List<ColdEmailCampaign>>
            {
                Success = false,
                Message = "An error occurred while retrieving campaigns",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("campaigns/{id}")]
    public async Task<ActionResult<ApiResponse<ColdEmailCampaign>>> GetCampaign(string id)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<ColdEmailCampaign>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            var campaign = await _dataService.GetColdEmailCampaignAsync(id);
            if (campaign == null || campaign.UserId != userId)
            {
                return NotFound(new ApiResponse<ColdEmailCampaign>
                {
                    Success = false,
                    Message = "Campaign not found"
                });
            }

            return Ok(new ApiResponse<ColdEmailCampaign>
            {
                Success = true,
                Message = "Campaign retrieved successfully",
                Data = campaign
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving campaign {CampaignId}", id);
            return StatusCode(500, new ApiResponse<ColdEmailCampaign>
            {
                Success = false,
                Message = "An error occurred while retrieving the campaign",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("campaigns")]
    public async Task<ActionResult<ApiResponse<ColdEmailCampaign>>> CreateCampaign([FromBody] CreateCampaignRequest request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<ColdEmailCampaign>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            // Get user's resume analysis
            var resumeAnalysis = await _dataService.GetResumeAnalysisByUserIdAsync(userId);
            if (resumeAnalysis == null)
            {
                return BadRequest(new ApiResponse<ColdEmailCampaign>
                {
                    Success = false,
                    Message = "No resume analysis found. Please upload and analyze your resume first."
                });
            }

            var campaign = new ColdEmailCampaign
            {
                UserId = userId,
                ResumeAnalysisId = resumeAnalysis.Id,
                CampaignName = request.CampaignName,
                SelectedTemplate = request.SelectedTemplate,
                CustomizedTemplate = request.CustomizedTemplate,
                TargetIndustries = request.TargetIndustries,
                TargetSkills = request.TargetSkills,
                Status = "draft"
            };

            var createdCampaign = await _dataService.CreateColdEmailCampaignAsync(campaign);

            return CreatedAtAction(nameof(GetCampaign), new { id = createdCampaign.Id }, new ApiResponse<ColdEmailCampaign>
            {
                Success = true,
                Message = "Campaign created successfully",
                Data = createdCampaign
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating campaign");
            return StatusCode(500, new ApiResponse<ColdEmailCampaign>
            {
                Success = false,
                Message = "An error occurred while creating the campaign",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("campaigns/{id}/start")]
    public async Task<ActionResult<ApiResponse<object>>> StartCampaign(string id, [FromBody] StartCampaignRequest request)
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

            var campaign = await _dataService.GetColdEmailCampaignAsync(id);
            if (campaign == null || campaign.UserId != userId)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Campaign not found"
                });
            }

            // Get matching HR contacts
            var hrContacts = await _dataService.GetHRContactsAsync(
                campaign.TargetIndustries.Any() ? campaign.TargetIndustries : null,
                campaign.TargetSkills.Any() ? campaign.TargetSkills : null
            );

            // Limit to max emails
            var targetContacts = hrContacts
                .Where(c => !c.IsContacted || c.ContactAttempts < 3)
                .Take(request.MaxEmails)
                .ToList();

            // Update campaign
            campaign.Status = "active";
            campaign.StartedAt = DateTime.UtcNow;
            campaign.TotalEmails = targetContacts.Count;
            await _dataService.UpdateColdEmailCampaignAsync(campaign);

            // Trigger N8N workflow for cold email sending
            await TriggerColdEmailWorkflow(new ColdEmailRequest
            {
                UserId = userId,
                CampaignId = id,
                TargetIndustries = campaign.TargetIndustries,
                TargetSkills = campaign.TargetSkills,
                EmailTemplate = campaign.CustomizedTemplate,
                MaxEmails = request.MaxEmails
            });

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = $"Campaign started successfully. {targetContacts.Count} emails will be sent.",
                Data = new { EmailCount = targetContacts.Count }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting campaign {CampaignId}", id);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while starting the campaign",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("campaigns/{id}/outreach")]
    public async Task<ActionResult<ApiResponse<List<ColdEmailOutreach>>>> GetCampaignOutreach(string id)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<List<ColdEmailOutreach>>
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            var campaign = await _dataService.GetColdEmailCampaignAsync(id);
            if (campaign == null || campaign.UserId != userId)
            {
                return NotFound(new ApiResponse<List<ColdEmailOutreach>>
                {
                    Success = false,
                    Message = "Campaign not found"
                });
            }

            var outreaches = await _dataService.GetColdEmailOutreachesAsync(id);

            return Ok(new ApiResponse<List<ColdEmailOutreach>>
            {
                Success = true,
                Message = "Campaign outreach retrieved successfully",
                Data = outreaches
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving campaign outreach {CampaignId}", id);
            return StatusCode(500, new ApiResponse<List<ColdEmailOutreach>>
            {
                Success = false,
                Message = "An error occurred while retrieving outreach data",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    // N8N Webhook endpoints for email tracking
    [HttpPost("tracking/sent")]
    public async Task<ActionResult<ApiResponse<object>>> EmailSent([FromBody] EmailResponse response)
    {
        try
        {
            var outreach = await _dataService.GetColdEmailOutreachAsync(response.OutreachId);
            if (outreach != null)
            {
                outreach.Status = response.Status;
                outreach.SentAt = response.Timestamp;
                await _dataService.UpdateColdEmailOutreachAsync(outreach);

                // Update campaign stats
                var campaign = await _dataService.GetColdEmailCampaignAsync(outreach.CampaignId);
                if (campaign != null)
                {
                    campaign.EmailsSent++;
                    await _dataService.UpdateColdEmailCampaignAsync(campaign);
                }
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Email sent status updated"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating email sent status");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while updating status",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("tracking/opened")]
    public async Task<ActionResult<ApiResponse<object>>> EmailOpened([FromBody] EmailResponse response)
    {
        try
        {
            var outreach = await _dataService.GetColdEmailOutreachAsync(response.OutreachId);
            if (outreach != null)
            {
                outreach.OpenedAt = response.Timestamp;
                await _dataService.UpdateColdEmailOutreachAsync(outreach);

                // Update campaign stats
                var campaign = await _dataService.GetColdEmailCampaignAsync(outreach.CampaignId);
                if (campaign != null)
                {
                    campaign.EmailsOpened++;
                    await _dataService.UpdateColdEmailCampaignAsync(campaign);
                }
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Email opened status updated"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating email opened status");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while updating status",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("tracking/replied")]
    public async Task<ActionResult<ApiResponse<object>>> EmailReplied([FromBody] EmailResponse response)
    {
        try
        {
            var outreach = await _dataService.GetColdEmailOutreachAsync(response.OutreachId);
            if (outreach != null)
            {
                outreach.Status = "replied";
                outreach.RepliedAt = response.Timestamp;
                outreach.ReplyEmail = response.ReplyContent; // Assuming reply content contains email
                await _dataService.UpdateColdEmailOutreachAsync(outreach);

                // Update campaign stats
                var campaign = await _dataService.GetColdEmailCampaignAsync(outreach.CampaignId);
                if (campaign != null)
                {
                    campaign.EmailsReplied++;
                    await _dataService.UpdateColdEmailCampaignAsync(campaign);
                }
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Email reply status updated"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating email reply status");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while updating status",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    private async Task TriggerColdEmailWorkflow(ColdEmailRequest request)
    {
        try
        {
            // TODO: Replace with your actual N8N webhook URL
            var n8nWebhookUrl = "https://your-n8n-instance.com/webhook/cold-email";

            using var httpClient = new HttpClient();
            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await httpClient.PostAsync(n8nWebhookUrl, content);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Failed to trigger cold email N8N workflow: {StatusCode} {ReasonPhrase}",
                    response.StatusCode, response.ReasonPhrase);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error triggering cold email N8N workflow");
        }
    }
}

// Request DTOs
public class CreateCampaignRequest
{
    public string CampaignName { get; set; } = string.Empty;
    public string SelectedTemplate { get; set; } = string.Empty; // "1", "2", "3", "4", or "5"
    public string CustomizedTemplate { get; set; } = string.Empty;
    public List<string> TargetIndustries { get; set; } = new();
    public List<string> TargetSkills { get; set; } = new();
}

public class StartCampaignRequest
{
    public int MaxEmails { get; set; } = 50;
}
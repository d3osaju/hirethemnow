using Microsoft.AspNetCore.Mvc;
using HireThemNoW.Server.Services;
using HireThemNoW.Server.Models;
using HireThemNoW.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace HireThemNoW.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AIAgentController : ControllerBase
    {
        private readonly IBedrockAgentService _bedrockService;
        private readonly IEmailService _emailService;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AIAgentController> _logger;

        public AIAgentController(
            IBedrockAgentService bedrockService,
            IEmailService emailService,
            ApplicationDbContext context,
            ILogger<AIAgentController> logger)
        {
            _bedrockService = bedrockService;
            _emailService = emailService;
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get the latest resume analysis for a user
        /// </summary>
        [HttpGet("resume-analysis/{userId}")]
        public async Task<IActionResult> GetResumeAnalysis(string userId)
        {
            try
            {
                _logger.LogInformation("Fetching resume analysis for user {UserId}", userId);

                var result = await _bedrockService.GetLatestAnalysisAsync(userId);

                if (result == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "No resume analysis found for this user"
                    });
                }

                return Ok(new ApiResponse<ResumeAnalysisResult>
                {
                    Success = true,
                    Data = result,
                    Message = "Resume analysis retrieved successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching resume analysis for user {UserId}", userId);
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"Error fetching resume analysis: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Webhook endpoint for Lambda to store resume analysis results
        /// </summary>
        [HttpPost("webhook/resume-analyzed")]
        public async Task<IActionResult> ResumeAnalyzedWebhook([FromBody] ResumeAnalysisData data)
        {
            try
            {
                _logger.LogInformation("Received resume analysis webhook for user {UserId}", data.UserId);

                await _bedrockService.StoreResumeAnalysisAsync(data);

                // Send email notification to user
                try
                {
                    var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == data.UserId);
                    if (user != null && !string.IsNullOrEmpty(user.Email))
                    {
                        var atsScore = data.AtsScore?.Overall ?? 0;
                        await _emailService.SendResumeAnalysisCompleteEmailAsync(
                            user.Email,
                            user.Name ?? "there",
                            atsScore
                        );
                        _logger.LogInformation("Sent analysis complete email to {Email}", user.Email);
                    }
                }
                catch (Exception emailEx)
                {
                    _logger.LogError(emailEx, "Failed to send email notification but analysis was stored");
                    // Don't fail the request if email fails
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Resume analysis stored successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error storing resume analysis from webhook");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = $"Error storing resume analysis: {ex.Message}"
                });
            }
        }
    }
}

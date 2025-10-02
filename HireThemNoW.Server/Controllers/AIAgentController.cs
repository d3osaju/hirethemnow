using Microsoft.AspNetCore.Mvc;
using HireThemNoW.Server.Services;
using HireThemNoW.Server.Models;

namespace HireThemNoW.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AIAgentController : ControllerBase
    {
        private readonly IBedrockAgentService _bedrockService;
        private readonly ILogger<AIAgentController> _logger;

        public AIAgentController(
            IBedrockAgentService bedrockService,
            ILogger<AIAgentController> logger)
        {
            _bedrockService = bedrockService;
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

using Amazon.BedrockRuntime;
using Amazon.S3;
using Amazon.Textract;
using Microsoft.AspNetCore.Mvc;

namespace HireThemNoW.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly IAmazonS3 _s3Client;
        private readonly IAmazonTextract _textractClient;
        private readonly IAmazonBedrockRuntime _bedrockClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<HealthController> _logger;

        public HealthController(
            IAmazonS3 s3Client,
            IAmazonTextract textractClient,
            IAmazonBedrockRuntime bedrockClient,
            IConfiguration configuration,
            ILogger<HealthController> logger)
        {
            _s3Client = s3Client;
            _textractClient = textractClient;
            _bedrockClient = bedrockClient;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpGet]
        public ActionResult<object> GetHealth()
        {
            return Ok(new
            {
                status = "healthy",
                timestamp = DateTime.UtcNow,
                message = "API is running and CORS is configured"
            });
        }

        [HttpGet("aws-services")]
        public async Task<ActionResult<AwsServicesHealthResponse>> GetAwsServicesHealth()
        {
            _logger.LogInformation("Starting AWS services health check");

            var s3Health = await CheckS3HealthAsync();
            var textractHealth = await CheckTextractHealthAsync();
            var bedrockHealth = await CheckBedrockHealthAsync();

            var response = new AwsServicesHealthResponse
            {
                AllServicesHealthy = s3Health.IsAccessible && textractHealth.IsAccessible && bedrockHealth.IsAccessible,
                S3 = s3Health,
                Textract = textractHealth,
                Bedrock = bedrockHealth,
                CheckedAt = DateTime.UtcNow
            };

            _logger.LogInformation(
                "AWS services health check completed. S3: {S3Status}, Textract: {TextractStatus}, Bedrock: {BedrockStatus}",
                s3Health.IsAccessible ? "OK" : "FAILED",
                textractHealth.IsAccessible ? "OK" : "FAILED",
                bedrockHealth.IsAccessible ? "OK" : "FAILED"
            );

            return Ok(response);
        }

        private async Task<S3HealthStatus> CheckS3HealthAsync()
        {
            try
            {
                var bucketName = _configuration["AWS:S3:BucketName"] ?? "hirethemnow-files";
                
                _logger.LogDebug("Checking S3 access for bucket: {BucketName}", bucketName);
                
                var request = new Amazon.S3.Model.ListObjectsV2Request
                {
                    BucketName = bucketName,
                    MaxKeys = 1
                };

                await _s3Client.ListObjectsV2Async(request);

                return new S3HealthStatus
                {
                    IsAccessible = true,
                    BucketName = bucketName,
                    ErrorMessage = null
                };
            }
            catch (Amazon.S3.AmazonS3Exception ex) when (ex.ErrorCode == "AccessDenied")
            {
                _logger.LogWarning(ex, "S3 access denied");
                return new S3HealthStatus
                {
                    IsAccessible = false,
                    BucketName = _configuration["AWS:S3:BucketName"] ?? "hirethemnow-files",
                    ErrorMessage = $"Access denied: {ex.Message}"
                };
            }
            catch (Amazon.S3.AmazonS3Exception ex) when (ex.ErrorCode == "NoSuchBucket")
            {
                _logger.LogWarning(ex, "S3 bucket not found");
                return new S3HealthStatus
                {
                    IsAccessible = false,
                    BucketName = _configuration["AWS:S3:BucketName"] ?? "hirethemnow-files",
                    ErrorMessage = $"Bucket not found: {ex.Message}"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "S3 health check failed");
                return new S3HealthStatus
                {
                    IsAccessible = false,
                    BucketName = _configuration["AWS:S3:BucketName"] ?? "hirethemnow-files",
                    ErrorMessage = ex.Message
                };
            }
        }

        private async Task<TextractHealthStatus> CheckTextractHealthAsync()
        {
            try
            {
                _logger.LogDebug("Checking Textract access");
                
                // Create minimal test request with dummy data
                var request = new Amazon.Textract.Model.DetectDocumentTextRequest
                {
                    Document = new Amazon.Textract.Model.Document
                    {
                        Bytes = new System.IO.MemoryStream(new byte[] { 0x25, 0x50, 0x44, 0x46 }) // PDF header
                    }
                };

                // This will fail with validation error but will succeed if we have permissions
                try
                {
                    await _textractClient.DetectDocumentTextAsync(request);
                }
                catch (Amazon.Textract.AmazonTextractException ex) when (
                    ex.ErrorCode == "InvalidParameterException" || 
                    ex.Message.Contains("unsupported document format"))
                {
                    // This is expected - we have permissions but sent invalid data
                    _logger.LogDebug("Textract validation error (expected): {Message}", ex.Message);
                }

                return new TextractHealthStatus
                {
                    IsAccessible = true,
                    Region = _textractClient.Config.RegionEndpoint?.SystemName,
                    ErrorMessage = null
                };
            }
            catch (Amazon.Textract.AmazonTextractException ex) when (ex.StatusCode == System.Net.HttpStatusCode.Forbidden)
            {
                _logger.LogWarning(ex, "Textract access denied");
                return new TextractHealthStatus
                {
                    IsAccessible = false,
                    Region = _textractClient.Config.RegionEndpoint?.SystemName,
                    ErrorMessage = $"Access denied: {ex.Message}"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Textract health check failed");
                return new TextractHealthStatus
                {
                    IsAccessible = false,
                    Region = _textractClient.Config.RegionEndpoint?.SystemName,
                    ErrorMessage = ex.Message
                };
            }
        }

        private async Task<BedrockHealthStatus> CheckBedrockHealthAsync()
        {
            var modelId = _configuration["ResumeParsing:BedrockModelId"] ?? "amazon.nova-pro-v1:0";
            
            try
            {
                _logger.LogDebug("Checking Bedrock access for model: {ModelId}", modelId);
                
                // Create minimal test request
                var testPrompt = "test";
                var requestBody = new
                {
                    messages = new[]
                    {
                        new
                        {
                            role = "user",
                            content = new[]
                            {
                                new { text = testPrompt }
                            }
                        }
                    },
                    inferenceConfig = new
                    {
                        maxTokens = 10,
                        temperature = 0.0
                    }
                };

                var requestBodyJson = System.Text.Json.JsonSerializer.Serialize(requestBody);
                var requestBodyStream = new System.IO.MemoryStream(System.Text.Encoding.UTF8.GetBytes(requestBodyJson));

                var invokeRequest = new Amazon.BedrockRuntime.Model.InvokeModelRequest
                {
                    ModelId = modelId,
                    Body = requestBodyStream,
                    ContentType = "application/json"
                };

                await _bedrockClient.InvokeModelAsync(invokeRequest);

                return new BedrockHealthStatus
                {
                    IsAccessible = true,
                    ModelId = modelId,
                    Region = _bedrockClient.Config.RegionEndpoint?.SystemName,
                    ErrorMessage = null
                };
            }
            catch (Amazon.BedrockRuntime.AmazonBedrockRuntimeException ex) when (ex.StatusCode == System.Net.HttpStatusCode.Forbidden)
            {
                _logger.LogWarning(ex, "Bedrock access denied for model: {ModelId}", modelId);
                return new BedrockHealthStatus
                {
                    IsAccessible = false,
                    ModelId = modelId,
                    Region = _bedrockClient.Config.RegionEndpoint?.SystemName,
                    ErrorMessage = $"Access denied: {ex.Message}"
                };
            }
            catch (Amazon.BedrockRuntime.AmazonBedrockRuntimeException ex) when (ex.ErrorCode == "ResourceNotFoundException")
            {
                _logger.LogWarning(ex, "Bedrock model not found: {ModelId}", modelId);
                return new BedrockHealthStatus
                {
                    IsAccessible = false,
                    ModelId = modelId,
                    Region = _bedrockClient.Config.RegionEndpoint?.SystemName,
                    ErrorMessage = $"Model not found: {ex.Message}"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Bedrock health check failed for model: {ModelId}", modelId);
                return new BedrockHealthStatus
                {
                    IsAccessible = false,
                    ModelId = modelId,
                    Region = _bedrockClient.Config.RegionEndpoint?.SystemName,
                    ErrorMessage = ex.Message
                };
            }
        }
    }

    // Response models
    public class AwsServicesHealthResponse
    {
        public bool AllServicesHealthy { get; set; }
        public S3HealthStatus S3 { get; set; } = null!;
        public TextractHealthStatus Textract { get; set; } = null!;
        public BedrockHealthStatus Bedrock { get; set; } = null!;
        public DateTime CheckedAt { get; set; }
    }

    public class S3HealthStatus
    {
        public bool IsAccessible { get; set; }
        public string BucketName { get; set; } = null!;
        public string? ErrorMessage { get; set; }
    }

    public class TextractHealthStatus
    {
        public bool IsAccessible { get; set; }
        public string? Region { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class BedrockHealthStatus
    {
        public bool IsAccessible { get; set; }
        public string ModelId { get; set; } = null!;
        public string? Region { get; set; }
        public string? ErrorMessage { get; set; }
    }
}

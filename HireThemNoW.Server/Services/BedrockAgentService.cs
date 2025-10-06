using HireThemNoW.Server.Data;
using HireThemNoW.Server.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Text.Json.Serialization;
using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;
using Amazon.Textract;
using Amazon.Textract.Model;
using System.Text;

namespace HireThemNoW.Server.Services
{
    public class BedrockAgentService : IBedrockAgentService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BedrockAgentService> _logger;
        private readonly IAmazonBedrockRuntime _bedrockClient;
        private readonly IAmazonTextract _textractClient;
        private readonly IConfiguration _configuration;

        public BedrockAgentService(
            ApplicationDbContext context,
            ILogger<BedrockAgentService> logger,
            IAmazonBedrockRuntime bedrockClient,
            IAmazonTextract textractClient,
            IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _bedrockClient = bedrockClient;
            _textractClient = textractClient;
            _configuration = configuration;
        }

        public async Task<ResumeAnalysisResult> AnalyzeResumeAsync(string userId)
        {
            _logger.LogInformation("Fetching latest resume analysis for user {UserId}", userId);

            var analysis = await _context.ResumeAnalyses
                .Where(ra => ra.UserId == userId)
                .OrderByDescending(ra => ra.ProcessedAt)
                .FirstOrDefaultAsync();

            if (analysis == null)
            {
                throw new InvalidOperationException($"No resume analysis found for user {userId}");
            }

            return MapToResult(analysis);
        }

        public async Task<ResumeAnalysisResult?> GetLatestAnalysisAsync(string userId)
        {
            var analysis = await _context.ResumeAnalyses
                .Where(ra => ra.UserId == userId)
                .OrderByDescending(ra => ra.ProcessedAt)
                .FirstOrDefaultAsync();

            return analysis != null ? MapToResult(analysis) : null;
        }

        public async Task CreatePendingAnalysisAsync(string userId, string s3Url)
        {
            _logger.LogInformation("Creating pending analysis record for user {UserId}", userId);

            var analysis = new ResumeAnalysis
            {
                UserId = userId,
                S3Url = s3Url,
                ResumeUrl = s3Url,
                Status = "processing",
                ProcessedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ResumeAnalyses.Add(analysis);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created pending analysis for user {UserId}", userId);
        }

        public async Task StoreResumeAnalysisAsync(ResumeAnalysisData data)
        {
            _logger.LogInformation("Storing ATS analysis for user {UserId}", data.UserId);

            try
            {
                var analysis = new ResumeAnalysis
                {
                    UserId = data.UserId ?? string.Empty,
                    ResumeUrl = data.S3Url,
                    PersonalInfo = data.PersonalInfo != null ? JsonSerializer.Serialize(data.PersonalInfo) : null,
                    TechnicalSkills = JsonSerializer.Serialize(data.Skills?.Technical ?? new List<string>()),
                    SoftSkills = JsonSerializer.Serialize(data.Skills?.Soft ?? new List<string>()),
                    ProgrammingLanguages = JsonSerializer.Serialize(data.Skills?.Languages ?? new List<string>()),
                    Tools = JsonSerializer.Serialize(data.Skills?.Tools ?? new List<string>()),
                    ExperienceSummary = JsonSerializer.Serialize(data.Experience ?? new List<ExperienceData>()),
                    Education = JsonSerializer.Serialize(data.Education ?? new List<EducationData>()),
                    Certifications = JsonSerializer.Serialize(data.Certifications ?? new List<string>()),
                    Summary = data.Summary,
                    S3Url = data.S3Url,

                    // ATS Scoring
                    AtsOverallScore = data.AtsScore?.Overall,
                    AtsFormattingScore = data.AtsScore?.Breakdown?.Formatting,
                    AtsKeywordsScore = data.AtsScore?.Breakdown?.Keywords,
                    AtsExperienceScore = data.AtsScore?.Breakdown?.Experience,
                    AtsEducationScore = data.AtsScore?.Breakdown?.Education,
                    AtsSkillsScore = data.AtsScore?.Breakdown?.Skills,
                    AtsAchievementsScore = data.AtsScore?.Breakdown?.Achievements,

                    Strengths = JsonSerializer.Serialize(data.Strengths ?? new List<string>()),
                    Weaknesses = JsonSerializer.Serialize(data.Weaknesses ?? new List<string>()),
                    Improvements = JsonSerializer.Serialize(data.Improvements ?? new List<ImprovementSuggestion>()),

                    KeywordsFound = JsonSerializer.Serialize(data.Keywords?.Found ?? new List<string>()),
                    KeywordsMissing = JsonSerializer.Serialize(data.Keywords?.Missing ?? new List<string>()),
                    KeywordDensity = data.Keywords?.Density,

                    ReadabilityScore = data.Readability?.Score,
                    ReadabilityIssues = JsonSerializer.Serialize(data.Readability?.Issues ?? new List<string>()),

                    Recommendations = JsonSerializer.Serialize(data.Recommendations ?? new List<string>()),
                    Status = "completed",
                    ProcessedAt = string.IsNullOrEmpty(data.ProcessedAt) ? DateTime.UtcNow : DateTime.Parse(data.ProcessedAt),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.ResumeAnalyses.Add(analysis);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully stored resume analysis for user {UserId}", data.UserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error storing resume analysis for user {UserId}", data.UserId);
                throw;
            }
        }

        private ResumeAnalysisResult MapToResult(ResumeAnalysis analysis)
        {
            return new ResumeAnalysisResult
            {
                UserId = analysis.UserId,
                Status = analysis.Status,
                PersonalInfo = !string.IsNullOrEmpty(analysis.PersonalInfo)
                    ? JsonSerializer.Deserialize<PersonalInfo>(analysis.PersonalInfo)
                    : null,
                Skills = new SkillsData
                {
                    Technical = DeserializeList(analysis.TechnicalSkills),
                    Soft = DeserializeList(analysis.SoftSkills),
                    Languages = DeserializeList(analysis.ProgrammingLanguages),
                    Tools = DeserializeList(analysis.Tools)
                },
                Experience = JsonSerializer.Deserialize<List<ExperienceData>>(analysis.ExperienceSummary ?? "[]"),
                Education = JsonSerializer.Deserialize<List<EducationData>>(analysis.Education ?? "[]"),
                Certifications = DeserializeList(analysis.Certifications),
                Summary = analysis.Summary,
                AtsScore = new ATSScore
                {
                    Overall = analysis.AtsOverallScore ?? 0,
                    Breakdown = new ScoreBreakdown
                    {
                        Formatting = analysis.AtsFormattingScore ?? 0,
                        Keywords = analysis.AtsKeywordsScore ?? 0,
                        Experience = analysis.AtsExperienceScore ?? 0,
                        Education = analysis.AtsEducationScore ?? 0,
                        Skills = analysis.AtsSkillsScore ?? 0,
                        Achievements = analysis.AtsAchievementsScore ?? 0
                    }
                },
                Strengths = DeserializeList(analysis.Strengths),
                Weaknesses = DeserializeList(analysis.Weaknesses),
                Improvements = JsonSerializer.Deserialize<List<ImprovementSuggestion>>(analysis.Improvements ?? "[]"),
                Keywords = new KeywordAnalysis
                {
                    Found = DeserializeList(analysis.KeywordsFound),
                    Missing = DeserializeList(analysis.KeywordsMissing),
                    Density = analysis.KeywordDensity ?? 0
                },
                Readability = new ReadabilityScore
                {
                    Score = analysis.ReadabilityScore ?? 0,
                    Issues = DeserializeList(analysis.ReadabilityIssues)
                },
                Recommendations = DeserializeList(analysis.Recommendations),
                S3Url = analysis.S3Url,
                ProcessedAt = analysis.ProcessedAt
            };
        }

        public async Task<ParsedResumeResult> ParseAndStructureResumeAsync(string s3Url)
        {
            var startTime = DateTime.UtcNow;
            _logger.LogInformation("Starting resume parsing for S3 URL: {S3Url}", s3Url);

            try
            {
                // Validate S3 URL format
                if (string.IsNullOrWhiteSpace(s3Url) || !s3Url.StartsWith("s3://"))
                {
                    _logger.LogWarning("Invalid S3 URL format provided: {S3Url}", s3Url);
                    return new ParsedResumeResult
                    {
                        Success = false,
                        ErrorMessage = "Invalid S3 URL format. Expected format: s3://bucket-name/key",
                        PlainText = string.Empty,
                        StructuredContent = new StructuredResumeContent()
                    };
                }

                // Parse S3 URL
                var s3Parts = s3Url.Replace("s3://", "").Split('/', 2);
                if (s3Parts.Length != 2)
                {
                    _logger.LogWarning("Invalid S3 URL structure: {S3Url}", s3Url);
                    return new ParsedResumeResult
                    {
                        Success = false,
                        ErrorMessage = "Invalid S3 URL structure",
                        PlainText = string.Empty,
                        StructuredContent = new StructuredResumeContent()
                    };
                }

                var bucketName = s3Parts[0];
                var objectKey = s3Parts[1];

                _logger.LogDebug("Parsed S3 URL - Bucket: {Bucket}, Key: {Key}", bucketName, objectKey);

                // Step 1: Extract text using Textract
                var extractStartTime = DateTime.UtcNow;
                _logger.LogInformation("Starting text extraction from document using Textract");

                var plainText = await ExtractTextFromDocumentAsync(bucketName, objectKey);
                var extractTime = (DateTime.UtcNow - extractStartTime).TotalSeconds;

                _logger.LogInformation(
                    "Text extraction completed in {ExtractTime:F2}s, extracted {TextLength} characters",
                    extractTime, plainText.Length);

                if (string.IsNullOrWhiteSpace(plainText))
                {
                    _logger.LogWarning("No text extracted from document");
                    return new ParsedResumeResult
                    {
                        Success = false,
                        ErrorMessage = "No text could be extracted from the document",
                        PlainText = string.Empty,
                        StructuredContent = new StructuredResumeContent()
                    };
                }

                // Step 2: Structure the text using Claude via Bedrock
                var structureStartTime = DateTime.UtcNow;
                _logger.LogInformation("Starting content structuring with Claude via Bedrock");

                var structuredContent = await StructureResumeWithClaudeAsync(plainText);
                var structureTime = (DateTime.UtcNow - structureStartTime).TotalSeconds;

                _logger.LogInformation(
                    "Content structuring completed in {StructureTime:F2}s",
                    structureTime);

                var totalTime = (DateTime.UtcNow - startTime).TotalSeconds;
                _logger.LogInformation(
                    "Resume parsing completed successfully in {TotalTime:F2}s for S3 URL: {S3Url}",
                    totalTime, s3Url);

                return new ParsedResumeResult
                {
                    Success = true,
                    PlainText = plainText,
                    StructuredContent = structuredContent
                };
            }
            catch (ArgumentException ex)
            {
                var processingTime = (DateTime.UtcNow - startTime).TotalSeconds;
                _logger.LogError(ex,
                    "Invalid argument while parsing resume from S3 URL: {S3Url}, time elapsed: {ProcessingTime:F2}s",
                    s3Url, processingTime);

                return new ParsedResumeResult
                {
                    Success = false,
                    ErrorMessage = "Invalid input provided for resume parsing.",
                    PlainText = string.Empty,
                    StructuredContent = new StructuredResumeContent()
                };
            }
            catch (TimeoutException ex)
            {
                var processingTime = (DateTime.UtcNow - startTime).TotalSeconds;
                _logger.LogError(ex,
                    "Timeout while parsing resume from S3 URL: {S3Url}, time elapsed: {ProcessingTime:F2}s",
                    s3Url, processingTime);

                return new ParsedResumeResult
                {
                    Success = false,
                    ErrorMessage = "Resume parsing timed out. The document may be too large or complex.",
                    PlainText = string.Empty,
                    StructuredContent = new StructuredResumeContent()
                };
            }
            catch (Exception ex)
            {
                var processingTime = (DateTime.UtcNow - startTime).TotalSeconds;
                _logger.LogError(ex,
                    "Unexpected error parsing resume from S3 URL: {S3Url}, time elapsed: {ProcessingTime:F2}s",
                    s3Url, processingTime);

                return new ParsedResumeResult
                {
                    Success = false,
                    ErrorMessage = "An unexpected error occurred while parsing the resume document.",
                    PlainText = string.Empty,
                    StructuredContent = new StructuredResumeContent()
                };
            }
        }

        private async Task<string> ExtractTextFromDocumentAsync(string bucketName, string objectKey)
        {
            try
            {
                var request = new DetectDocumentTextRequest
                {
                    Document = new Document
                    {
                        S3Object = new Amazon.Textract.Model.S3Object
                        {
                            Bucket = bucketName,
                            Name = objectKey
                        }
                    }
                };

                var response = await _textractClient.DetectDocumentTextAsync(request);

                var textBuilder = new StringBuilder();
                foreach (var block in response.Blocks)
                {
                    if (block.BlockType == BlockType.LINE)
                    {
                        textBuilder.AppendLine(block.Text);
                    }
                }

                return textBuilder.ToString();
            }
            catch (AmazonTextractException ex) when (ex.StatusCode == System.Net.HttpStatusCode.Forbidden)
            {
                _logger.LogError(ex,
                    "Access denied to Textract service. IAM permissions missing for textract:DetectDocumentText. " +
                    "Document: {Bucket}/{Key}. Required permissions: textract:DetectDocumentText, s3:GetObject on bucket {Bucket}",
                    bucketName, objectKey, bucketName);
                throw;
            }
            catch (AmazonTextractException ex)
            {
                _logger.LogError(ex,
                    "Textract service error while extracting text from document: {Bucket}/{Key}. Status: {StatusCode}, Error: {ErrorCode}",
                    bucketName, objectKey, ex.StatusCode, ex.ErrorCode);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error extracting text from document: {Bucket}/{Key}", bucketName, objectKey);
                throw;
            }
        }

        private async Task<StructuredResumeContent> StructureResumeWithClaudeAsync(string plainText)
        {
            try
            {
                var modelId = _configuration["ResumeParsing:BedrockModelId"] ?? "amazon.nova-pro-v1:0";

                var prompt = $@"You are a resume parsing assistant. Extract and structure the following resume text into JSON format.

Resume Text:
{plainText}

Please extract and return ONLY a valid JSON object with the following structure (no markdown, no explanations):
{{
  ""personalInfo"": {{
    ""name"": ""string"",
    ""email"": ""string"",
    ""phone"": ""string"",
    ""location"": ""string"",
    ""linkedin"": ""string"",
    ""website"": ""string""
  }},
  ""summary"": ""string"",
  ""experience"": [
    {{
      ""company"": ""string"",
      ""title"": ""string"",
      ""location"": ""string"",
      ""startDate"": ""string"",
      ""endDate"": ""string"",
      ""description"": ""string"",
      ""achievements"": [""string""]
    }}
  ],
  ""education"": [
    {{
      ""institution"": ""string"",
      ""degree"": ""string"",
      ""field"": ""string"",
      ""graduationDate"": ""string"",
      ""gpa"": ""string""
    }}
  ],
  ""skills"": {{
    ""technical"": [""string""],
    ""soft"": [""string""],
    ""languages"": [""string""],
    ""tools"": [""string""]
  }},
  ""certifications"": [""string""],
  ""projects"": [
    {{
      ""name"": ""string"",
      ""description"": ""string"",
      ""technologies"": [""string""],
      ""url"": ""string""
    }}
  ]
}}

Return ONLY the JSON object, no other text.";

                // Check if using Nova or Claude model
                var isNovaModel = modelId.Contains("nova");
                
                object requestBody;
                if (isNovaModel)
                {
                    // Nova Pro format
                    requestBody = new
                    {
                        messages = new[]
                        {
                            new
                            {
                                role = "user",
                                content = new[]
                                {
                                    new { text = prompt }
                                }
                            }
                        },
                        inferenceConfig = new
                        {
                            max_new_tokens = 4096,
                            temperature = 0.7
                        }
                    };
                }
                else
                {
                    // Claude format
                    requestBody = new
                    {
                        anthropic_version = "bedrock-2023-05-31",
                        max_tokens = 4096,
                        messages = new[]
                        {
                            new
                            {
                                role = "user",
                                content = prompt
                            }
                        }
                    };
                }

                var requestBodyJson = JsonSerializer.Serialize(requestBody);
                var requestBodyStream = new MemoryStream(Encoding.UTF8.GetBytes(requestBodyJson));

                var invokeRequest = new InvokeModelRequest
                {
                    ModelId = modelId,
                    Body = requestBodyStream,
                    ContentType = "application/json",
                    Accept = "application/json"
                };

                _logger.LogDebug("Invoking Bedrock model: {ModelId}", modelId);

                var response = await _bedrockClient.InvokeModelAsync(invokeRequest);

                using var reader = new StreamReader(response.Body);
                var responseBody = await reader.ReadToEndAsync();

                _logger.LogDebug("Received response from Bedrock, length: {Length}", responseBody.Length);

                // Parse response based on model type
                string contentText;
                if (isNovaModel)
                {
                    // Parse Nova response
                    var novaResponse = JsonSerializer.Deserialize<NovaResponse>(responseBody);
                    if (novaResponse?.Output?.Message?.Content == null || novaResponse.Output.Message.Content.Length == 0)
                    {
                        _logger.LogWarning("Empty response from Nova");
                        return new StructuredResumeContent();
                    }
                    contentText = novaResponse.Output.Message.Content[0].Text;
                }
                else
                {
                    // Parse Claude response
                    var claudeResponse = JsonSerializer.Deserialize<ClaudeResponse>(responseBody);
                    if (claudeResponse?.Content == null || claudeResponse.Content.Length == 0)
                    {
                        _logger.LogWarning("Empty response from model");
                        return new StructuredResumeContent();
                    }
                    contentText = claudeResponse.Content[0].Text;
                }
                
                // Remove markdown code blocks if present
                contentText = contentText.Trim();
                if (contentText.StartsWith("```json"))
                {
                    contentText = contentText.Substring(7);
                }
                if (contentText.StartsWith("```"))
                {
                    contentText = contentText.Substring(3);
                }
                if (contentText.EndsWith("```"))
                {
                    contentText = contentText.Substring(0, contentText.Length - 3);
                }
                contentText = contentText.Trim();

                _logger.LogDebug("Parsing structured content from Claude response");

                var structuredContent = JsonSerializer.Deserialize<StructuredResumeContent>(contentText, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                return structuredContent ?? new StructuredResumeContent();
            }
            catch (AmazonBedrockRuntimeException ex) when (ex.StatusCode == System.Net.HttpStatusCode.Forbidden)
            {
                var modelId = _configuration["ResumeParsing:BedrockModelId"] ?? "amazon.nova-pro-v1:0";
                _logger.LogError(ex,
                    "Access denied to Bedrock model {ModelId}. IAM permissions missing. " +
                    "Required permissions: bedrock:InvokeModel on resource arn:aws:bedrock:{Region}::foundation-model/{ModelId}. " +
                    "Verify the IAM role has the correct Bedrock permissions configured.",
                    modelId, _bedrockClient.Config.RegionEndpoint?.SystemName ?? "us-east-1", modelId);
                throw;
            }
            catch (AmazonBedrockRuntimeException ex)
            {
                var modelId = _configuration["ResumeParsing:BedrockModelId"] ?? "amazon.nova-pro-v1:0";
                _logger.LogError(ex,
                    "Bedrock service error while structuring resume with model {ModelId}. Status: {StatusCode}, Error: {ErrorCode}",
                    modelId, ex.StatusCode, ex.ErrorCode);
                throw;
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Failed to parse JSON response from Bedrock model. The model may have returned invalid JSON.");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error structuring resume with Claude");
                throw;
            }
        }

        // Helper classes for model responses
        private class ClaudeResponse
        {
            [JsonPropertyName("content")]
            public ClaudeContent[]? Content { get; set; }

            [JsonPropertyName("stop_reason")]
            public string? StopReason { get; set; }
        }

        private class ClaudeContent
        {
            [JsonPropertyName("type")]
            public string? Type { get; set; }

            [JsonPropertyName("text")]
            public string Text { get; set; } = string.Empty;
        }

        private class NovaResponse
        {
            [JsonPropertyName("output")]
            public NovaOutput? Output { get; set; }
        }

        private class NovaOutput
        {
            [JsonPropertyName("message")]
            public NovaMessage? Message { get; set; }
        }

        private class NovaMessage
        {
            [JsonPropertyName("content")]
            public NovaContent[]? Content { get; set; }
        }

        private class NovaContent
        {
            [JsonPropertyName("text")]
            public string Text { get; set; } = string.Empty;
        }

        private List<string> DeserializeList(string? json)
        {
            if (string.IsNullOrEmpty(json)) return new List<string>();
            return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
        }
    }
}

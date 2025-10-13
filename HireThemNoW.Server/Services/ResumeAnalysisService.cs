using HireThemNoW.Server.Data;
using HireThemNoW.Server.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace HireThemNoW.Server.Services
{
    /// <summary>
    /// Service for resume ATS analysis operations
    /// </summary>
    public class ResumeAnalysisService : IResumeAnalysisService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ResumeAnalysisService> _logger;
        private readonly IBedrockAgentService _bedrockService;
        private readonly IEmailService _emailService;

        public ResumeAnalysisService(
            ApplicationDbContext context,
            ILogger<ResumeAnalysisService> logger,
            IBedrockAgentService bedrockService,
            IEmailService emailService)
        {
            _context = context;
            _logger = logger;
            _bedrockService = bedrockService;
            _emailService = emailService;
        }

        /// <summary>
        /// Analyzes a resume for ATS compatibility using parsed content
        /// </summary>
        public async Task<ResumeAnalysis> AnalyzeResumeAsync(string userId, int resumeContentId)
        {
            var startTime = DateTime.UtcNow;
            _logger.LogInformation("Starting ATS analysis for user {UserId}, resumeContentId {ResumeContentId}", 
                userId, resumeContentId);

            try
            {
                // 1. Retrieve parsed content from database by resumeContentId
                var resumeContent = await _context.ResumeContents
                    .FirstOrDefaultAsync(rc => rc.Id == resumeContentId && rc.UserId == userId);

                if (resumeContent == null)
                {
                    throw new InvalidOperationException($"Resume content with ID {resumeContentId} not found for user {userId}");
                }

                if (resumeContent.ParsingStatus != "completed")
                {
                    throw new InvalidOperationException($"Resume parsing is not complete. Current status: {resumeContent.ParsingStatus}");
                }

                if (string.IsNullOrEmpty(resumeContent.ParsedContent))
                {
                    throw new InvalidOperationException("No parsed content available for analysis");
                }

                // 2. Deserialize structured content JSON
                StructuredResumeContent? structuredContent;
                try
                {
                    structuredContent = JsonSerializer.Deserialize<StructuredResumeContent>(resumeContent.ParsedContent);
                }
                catch (JsonException ex)
                {
                    _logger.LogError(ex, "Failed to deserialize parsed content for resumeContentId {ResumeContentId}", resumeContentId);
                    throw new InvalidOperationException("Invalid parsed content format", ex);
                }

                if (structuredContent == null)
                {
                    throw new InvalidOperationException("Parsed content is null after deserialization");
                }

                // 3. Build comprehensive ATS analysis prompt
                var prompt = BuildAtsAnalysisPrompt(structuredContent);

                // 4. Call Bedrock service for analysis
                var bedrockStartTime = DateTime.UtcNow;
                var analysisResult = await CallBedrockForAnalysisAsync(prompt);
                var bedrockDuration = (DateTime.UtcNow - bedrockStartTime).TotalSeconds;
                
                _logger.LogInformation("Bedrock analysis completed in {Duration:F2}s for user {UserId}", 
                    bedrockDuration, userId);

                // 5. Calculate weighted overall score
                var overallScore = CalculateOverallScore(analysisResult);

                // 6. Map all analysis fields to ResumeAnalysis model
                var analysis = new ResumeAnalysis
                {
                    UserId = userId,
                    ResumeContentId = resumeContentId,
                    Status = "completed",
                    
                    // ATS Scores
                    AtsOverallScore = overallScore,
                    AtsFormattingScore = analysisResult.FormattingScore,
                    AtsKeywordsScore = analysisResult.KeywordsScore,
                    AtsExperienceScore = analysisResult.ExperienceScore,
                    AtsEducationScore = analysisResult.EducationScore,
                    AtsSkillsScore = analysisResult.SkillsScore,
                    AtsAchievementsScore = analysisResult.AchievementsScore,
                    ReadabilityScore = analysisResult.ReadabilityScore,
                    
                    // Feedback
                    Strengths = JsonSerializer.Serialize(analysisResult.Strengths),
                    Weaknesses = JsonSerializer.Serialize(analysisResult.Weaknesses),
                    Recommendations = JsonSerializer.Serialize(analysisResult.Recommendations),
                    
                    // Keywords
                    KeywordsFound = JsonSerializer.Serialize(analysisResult.KeywordsFound),
                    KeywordsMissing = JsonSerializer.Serialize(analysisResult.KeywordsMissing),
                    KeywordDensity = analysisResult.KeywordDensity,
                    
                    // Readability
                    ReadabilityIssues = JsonSerializer.Serialize(analysisResult.ReadabilityIssues),
                    
                    // Section Feedback
                    SectionFeedback = JsonSerializer.Serialize(analysisResult.SectionFeedback),
                    
                    ProcessedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // 7. Store analysis in database with status "completed"
                _context.ResumeAnalyses.Add(analysis);
                await _context.SaveChangesAsync();

                var totalDuration = (DateTime.UtcNow - startTime).TotalSeconds;
                _logger.LogInformation("ATS analysis completed in {Duration:F2}s for user {UserId}, overall score: {Score}", 
                    totalDuration, userId, overallScore);

                // 8. Trigger email notification with overall score
                try
                {
                    var user = await _context.Users.FindAsync(userId);
                    if (user != null)
                    {
                        await _emailService.SendAnalysisCompleteEmailAsync(userId, user.Email, user.Name, overallScore, analysisResult.Recommendations);
                        _logger.LogInformation("Analysis completion email sent to user {UserId}", userId);
                    }
                }
                catch (Exception emailEx)
                {
                    _logger.LogWarning(emailEx, "Failed to send analysis completion email to user {UserId}", userId);
                    // Don't fail the analysis if email fails
                }

                return analysis;
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("parsing is not complete"))
            {
                var duration = (DateTime.UtcNow - startTime).TotalSeconds;
                _logger.LogWarning(ex, "Parsing not complete for user {UserId}, resumeContentId {ResumeContentId} after {Duration:F2}s", 
                    userId, resumeContentId, duration);

                await HandleAnalysisErrorAsync(userId, resumeContentId, "Resume parsing is not complete. Please wait for parsing to finish.");
                throw new InvalidOperationException("Resume parsing is not complete. Please wait for parsing to finish.", ex);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("timeout") || ex.Message.Contains("took too long"))
            {
                var duration = (DateTime.UtcNow - startTime).TotalSeconds;
                _logger.LogError(ex, "Bedrock timeout during ATS analysis for user {UserId}, resumeContentId {ResumeContentId} after {Duration:F2}s", 
                    userId, resumeContentId, duration);

                await HandleAnalysisErrorAsync(userId, resumeContentId, "Analysis took too long. Please try again.");
                throw new InvalidOperationException("Analysis took too long. Please try again.", ex);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("Invalid response") || ex.Message.Contains("Invalid parsed content"))
            {
                var duration = (DateTime.UtcNow - startTime).TotalSeconds;
                _logger.LogError(ex, "Invalid Bedrock response during ATS analysis for user {UserId}, resumeContentId {ResumeContentId} after {Duration:F2}s", 
                    userId, resumeContentId, duration);

                await HandleAnalysisErrorAsync(userId, resumeContentId, "Unable to analyze resume. Please re-upload your resume.");
                throw new InvalidOperationException("Unable to analyze resume. Please re-upload your resume.", ex);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("service is busy") || ex.Message.Contains("temporarily unavailable"))
            {
                var duration = (DateTime.UtcNow - startTime).TotalSeconds;
                _logger.LogError(ex, "Bedrock service unavailable during ATS analysis for user {UserId}, resumeContentId {ResumeContentId} after {Duration:F2}s", 
                    userId, resumeContentId, duration);

                await HandleAnalysisErrorAsync(userId, resumeContentId, "Analysis service is temporarily unavailable. Please try again in a few minutes.");
                throw new InvalidOperationException("Analysis service is temporarily unavailable. Please try again in a few minutes.", ex);
            }
            catch (DbUpdateException ex)
            {
                var duration = (DateTime.UtcNow - startTime).TotalSeconds;
                _logger.LogError(ex, "Database error during ATS analysis for user {UserId}, resumeContentId {ResumeContentId} after {Duration:F2}s", 
                    userId, resumeContentId, duration);

                await HandleAnalysisErrorAsync(userId, resumeContentId, "Database error occurred. Please try again.");
                throw new InvalidOperationException("An error occurred saving your analysis. Please try again.", ex);
            }
            catch (JsonException ex)
            {
                var duration = (DateTime.UtcNow - startTime).TotalSeconds;
                _logger.LogError(ex, "JSON parsing error during ATS analysis for user {UserId}, resumeContentId {ResumeContentId} after {Duration:F2}s", 
                    userId, resumeContentId, duration);

                await HandleAnalysisErrorAsync(userId, resumeContentId, "Invalid content format. Please re-upload your resume.");
                throw new InvalidOperationException("Invalid content format. Please re-upload your resume.", ex);
            }
            catch (Exception ex)
            {
                var duration = (DateTime.UtcNow - startTime).TotalSeconds;
                _logger.LogError(ex, "Unexpected error during ATS analysis for user {UserId}, resumeContentId {ResumeContentId} after {Duration:F2}s: {ErrorType}", 
                    userId, resumeContentId, duration, ex.GetType().Name);

                await HandleAnalysisErrorAsync(userId, resumeContentId, "An unexpected error occurred. Please try again.");
                throw new InvalidOperationException("An unexpected error occurred during analysis. Please try again.", ex);
            }
        }

        /// <summary>
        /// Gets the latest analysis for a user
        /// </summary>
        public async Task<ResumeAnalysis?> GetLatestAnalysisAsync(string userId)
        {
            try
            {
                return await _context.ResumeAnalyses
                    .Where(ra => ra.UserId == userId)
                    .OrderByDescending(ra => ra.CreatedAt)
                    .FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving latest analysis for user {UserId}", userId);
                throw;
            }
        }

        /// <summary>
        /// Gets an analysis by ID with user ownership verification
        /// </summary>
        public async Task<ResumeAnalysis?> GetAnalysisByIdAsync(int analysisId, string userId)
        {
            try
            {
                return await _context.ResumeAnalyses
                    .FirstOrDefaultAsync(ra => ra.Id == analysisId && ra.UserId == userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving analysis {AnalysisId} for user {UserId}", analysisId, userId);
                throw;
            }
        }

        /// <summary>
        /// Retries analysis for a user's latest resume
        /// </summary>
        public async Task<bool> RetryAnalysisAsync(string userId)
        {
            try
            {
                _logger.LogInformation("Retrying analysis for user {UserId}", userId);

                // Get latest analysis for user
                var analysis = await GetLatestAnalysisAsync(userId);
                if (analysis == null)
                {
                    _logger.LogWarning("No analysis found for user {UserId} to retry", userId);
                    return false;
                }

                // Check if parsing is complete
                ResumeContent? resumeContent = null;
                if (analysis.ResumeContentId.HasValue)
                {
                    resumeContent = await _context.ResumeContents
                        .FirstOrDefaultAsync(rc => rc.Id == analysis.ResumeContentId.Value);
                }

                // Reset status based on parsing status
                if (resumeContent?.ParsingStatus == "completed")
                {
                    analysis.Status = "processing";
                    _logger.LogInformation("Reset analysis status to 'processing' for user {UserId}", userId);
                }
                else
                {
                    analysis.Status = "waiting_for_parsing";
                    _logger.LogInformation("Reset analysis status to 'waiting_for_parsing' for user {UserId}", userId);
                }

                // Clear error message and update timestamp
                analysis.AnalysisError = null;
                analysis.UpdatedAt = DateTime.UtcNow;

                // Save to database
                _context.ResumeAnalyses.Update(analysis);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully reset analysis for retry for user {UserId}", userId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrying analysis for user {UserId}", userId);
                throw;
            }
        }

        // Private helper methods will be implemented in the next subtasks
        /// <summary>
        /// Builds a comprehensive ATS analysis prompt with structured content
        /// </summary>
        private string BuildAtsAnalysisPrompt(StructuredResumeContent structuredContent)
        {
            var contentJson = JsonSerializer.Serialize(structuredContent, new JsonSerializerOptions 
            { 
                WriteIndented = true 
            });

            return $@"You are an expert ATS (Applicant Tracking System) resume analyzer. Analyze the following resume and provide detailed feedback on how well it will perform in automated screening systems.

RESUME CONTENT:
{contentJson}

ANALYSIS REQUIREMENTS:

1. FORMATTING ANALYSIS (Score 0-100):
   - Check for ATS-friendly structure (clear sections, standard headings)
   - Evaluate consistency in formatting
   - Assess appropriate use of whitespace
   - Check for problematic elements (tables, images, columns)
   
2. KEYWORDS ANALYSIS (Score 0-100):
   - Identify industry-relevant keywords present
   - Suggest missing important keywords
   - Calculate keyword density
   - Assess keyword placement and context

3. EXPERIENCE ANALYSIS (Score 0-100):
   - Evaluate use of action verbs
   - Check for quantifiable achievements
   - Assess relevance and clarity
   - Verify proper date formatting

4. EDUCATION ANALYSIS (Score 0-100):
   - Check completeness of education information
   - Assess relevance and presentation
   - Verify proper formatting

5. SKILLS ANALYSIS (Score 0-100):
   - Evaluate skill categorization
   - Assess relevance to industry
   - Check for proper presentation

6. ACHIEVEMENTS ANALYSIS (Score 0-100):
   - Identify quantifiable results
   - Assess impact statements
   - Evaluate specificity

7. READABILITY ANALYSIS (Score 0-100):
   - Assess sentence structure
   - Check for clarity and conciseness
   - Identify readability issues

SECTION-BY-SECTION FEEDBACK:
Provide detailed feedback for each section: Personal Information, Professional Summary, Work Experience, Education, Skills, Certifications, Projects, and Overall Formatting.

PROVIDE YOUR ANALYSIS IN THE FOLLOWING JSON FORMAT:
{{
  ""formattingScore"": 0-100,
  ""keywordsScore"": 0-100,
  ""experienceScore"": 0-100,
  ""educationScore"": 0-100,
  ""skillsScore"": 0-100,
  ""achievementsScore"": 0-100,
  ""readabilityScore"": 0-100,
  
  ""strengths"": [""strength 1"", ""strength 2"", ""strength 3""],
  ""weaknesses"": [""weakness 1"", ""weakness 2"", ""weakness 3""],
  ""recommendations"": [""recommendation 1"", ""recommendation 2"", ""recommendation 3"", ""recommendation 4"", ""recommendation 5""],
  
  ""keywordsFound"": [""keyword1"", ""keyword2""],
  ""keywordsMissing"": [""keyword1"", ""keyword2""],
  ""keywordDensity"": 0-100,
  
  ""readabilityIssues"": [""issue1"", ""issue2""],
  
  ""sectionFeedback"": {{
    ""personalInfo"": {{
      ""sectionName"": ""Personal Information"",
      ""score"": 0-100,
      ""issues"": [""issue1""],
      ""suggestions"": [""suggestion1""]
    }},
    ""summary"": {{
      ""sectionName"": ""Professional Summary"",
      ""score"": 0-100,
      ""issues"": [""issue1""],
      ""suggestions"": [""suggestion1""]
    }},
    ""experience"": {{
      ""sectionName"": ""Work Experience"",
      ""score"": 0-100,
      ""issues"": [""issue1""],
      ""suggestions"": [""suggestion1""]
    }},
    ""education"": {{
      ""sectionName"": ""Education"",
      ""score"": 0-100,
      ""issues"": [""issue1""],
      ""suggestions"": [""suggestion1""]
    }},
    ""skills"": {{
      ""sectionName"": ""Skills"",
      ""score"": 0-100,
      ""issues"": [""issue1""],
      ""suggestions"": [""suggestion1""]
    }},
    ""certifications"": {{
      ""sectionName"": ""Certifications"",
      ""score"": 0-100,
      ""issues"": [""issue1""],
      ""suggestions"": [""suggestion1""]
    }},
    ""projects"": {{
      ""sectionName"": ""Projects"",
      ""score"": 0-100,
      ""issues"": [""issue1""],
      ""suggestions"": [""suggestion1""]
    }}
  }}
}}

Be specific, actionable, and constructive in your feedback. Focus on how to improve ATS compatibility and overall resume effectiveness. Ensure all scores are between 0-100 and provide at least 3 strengths, 3 weaknesses, and 5 recommendations.";
        }

        /// <summary>
        /// Calls Bedrock for ATS analysis with comprehensive error handling
        /// </summary>
        private async Task<AtsAnalysisResult> CallBedrockForAnalysisAsync(string prompt)
        {
            try
            {
                return await _bedrockService.AnalyzeResumeForAtsAsync(prompt);
            }
            catch (TimeoutException ex)
            {
                _logger.LogError(ex, "Bedrock timeout during ATS analysis");
                throw new InvalidOperationException("Analysis took too long. Please try again.", ex);
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Invalid JSON response from Bedrock during ATS analysis");
                throw new InvalidOperationException("Invalid response from analysis service. Please try again.", ex);
            }
            catch (Exception ex) when (ex.Message.Contains("throttl") || ex.Message.Contains("rate limit"))
            {
                _logger.LogError(ex, "Bedrock throttling during ATS analysis");
                throw new InvalidOperationException("Analysis service is busy. Please try again in a few minutes.", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during Bedrock ATS analysis");
                throw new InvalidOperationException("Analysis service is temporarily unavailable. Please try again.", ex);
            }
        }

        /// <summary>
        /// Calculates the weighted overall ATS score
        /// Weights: formatting (20%), keywords (25%), experience (25%), education (10%), skills (15%), achievements (5%)
        /// </summary>
        private int CalculateOverallScore(AtsAnalysisResult analysisResult)
        {
            try
            {
                // Define weights as per requirements
                const double formattingWeight = 0.20;    // 20%
                const double keywordsWeight = 0.25;      // 25%
                const double experienceWeight = 0.25;    // 25%
                const double educationWeight = 0.10;     // 10%
                const double skillsWeight = 0.15;        // 15%
                const double achievementsWeight = 0.05;  // 5%

                // Validate score range (0-100) and handle missing section scores
                var formattingScore = Math.Max(0, Math.Min(100, analysisResult.FormattingScore));
                var keywordsScore = Math.Max(0, Math.Min(100, analysisResult.KeywordsScore));
                var experienceScore = Math.Max(0, Math.Min(100, analysisResult.ExperienceScore));
                var educationScore = Math.Max(0, Math.Min(100, analysisResult.EducationScore));
                var skillsScore = Math.Max(0, Math.Min(100, analysisResult.SkillsScore));
                var achievementsScore = Math.Max(0, Math.Min(100, analysisResult.AchievementsScore));

                // Apply weighted average formula
                var weightedScore = (formattingScore * formattingWeight) +
                                  (keywordsScore * keywordsWeight) +
                                  (experienceScore * experienceWeight) +
                                  (educationScore * educationWeight) +
                                  (skillsScore * skillsWeight) +
                                  (achievementsScore * achievementsWeight);

                // Round to nearest integer and ensure it's within valid range
                var overallScore = (int)Math.Round(weightedScore);
                overallScore = Math.Max(0, Math.Min(100, overallScore));

                _logger.LogDebug("Calculated overall ATS score: {Score} (formatting: {Formatting}, keywords: {Keywords}, " +
                               "experience: {Experience}, education: {Education}, skills: {Skills}, achievements: {Achievements})",
                    overallScore, formattingScore, keywordsScore, experienceScore, educationScore, skillsScore, achievementsScore);

                return overallScore;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating overall ATS score, using default score of 0");
                return 0;
            }
        }

        /// <summary>
        /// Handles analysis errors by updating the analysis status and logging the error
        /// </summary>
        private async Task HandleAnalysisErrorAsync(string userId, int resumeContentId, string errorMessage)
        {
            try
            {
                // Find the analysis record - try by resumeContentId first, then by userId if not found
                var analysis = await _context.ResumeAnalyses
                    .FirstOrDefaultAsync(ra => ra.UserId == userId && ra.ResumeContentId == resumeContentId);

                if (analysis == null)
                {
                    // If not found by resumeContentId, try to find the latest analysis for the user
                    analysis = await _context.ResumeAnalyses
                        .Where(ra => ra.UserId == userId)
                        .OrderByDescending(ra => ra.CreatedAt)
                        .FirstOrDefaultAsync();
                }

                if (analysis != null)
                {
                    analysis.Status = "failed";
                    analysis.AnalysisError = errorMessage;
                    analysis.UpdatedAt = DateTime.UtcNow;

                    _context.ResumeAnalyses.Update(analysis);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Updated analysis status to 'failed' for user {UserId}, analysisId {AnalysisId}, error: {Error}", 
                        userId, analysis.Id, errorMessage);
                }
                else
                {
                    _logger.LogWarning("No analysis record found to update for user {UserId}, resumeContentId {ResumeContentId}", 
                        userId, resumeContentId);
                }
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error while updating analysis status to failed for user {UserId}, resumeContentId {ResumeContentId}", 
                    userId, resumeContentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error updating analysis status to failed for user {UserId}, resumeContentId {ResumeContentId}", 
                    userId, resumeContentId);
            }
        }
    }
}
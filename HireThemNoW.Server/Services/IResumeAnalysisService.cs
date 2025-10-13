using HireThemNoW.Server.Models;

namespace HireThemNoW.Server.Services
{
    /// <summary>
    /// Service interface for resume ATS analysis operations
    /// </summary>
    public interface IResumeAnalysisService
    {
        /// <summary>
        /// Analyzes a resume for ATS compatibility using parsed content
        /// </summary>
        /// <param name="userId">The user ID who owns the resume</param>
        /// <param name="resumeContentId">The ID of the parsed resume content</param>
        /// <returns>The completed analysis result</returns>
        Task<ResumeAnalysis> AnalyzeResumeAsync(string userId, int resumeContentId);

        /// <summary>
        /// Gets the latest analysis for a user
        /// </summary>
        /// <param name="userId">The user ID</param>
        /// <returns>The latest analysis or null if not found</returns>
        Task<ResumeAnalysis?> GetLatestAnalysisAsync(string userId);

        /// <summary>
        /// Gets an analysis by ID with user ownership verification
        /// </summary>
        /// <param name="analysisId">The analysis ID</param>
        /// <param name="userId">The user ID for ownership verification</param>
        /// <returns>The analysis or null if not found or unauthorized</returns>
        Task<ResumeAnalysis?> GetAnalysisByIdAsync(int analysisId, string userId);

        /// <summary>
        /// Retries analysis for a user's latest resume
        /// </summary>
        /// <param name="userId">The user ID</param>
        /// <returns>True if retry was initiated, false if no analysis found</returns>
        Task<bool> RetryAnalysisAsync(string userId);
    }
}
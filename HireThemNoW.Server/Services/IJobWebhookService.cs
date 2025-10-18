using HireThemNoW.Server.Models;

namespace HireThemNoW.Server.Services
{
    /// <summary>
    /// Service interface for handling job webhook operations
    /// Provides methods for validating, sanitizing, and storing job opportunities
    /// </summary>
    public interface IJobWebhookService
    {
        /// <summary>
        /// Creates a new job opportunity from webhook data
        /// Validates, sanitizes, and stores the job opportunity in the database
        /// </summary>
        /// <param name="jobDto">The job opportunity data transfer object</param>
        /// <returns>The created JobOpportunity entity</returns>
        /// <exception cref="ArgumentNullException">Thrown when jobDto is null</exception>
        /// <exception cref="ArgumentException">Thrown when validation fails</exception>
        /// <exception cref="InvalidOperationException">Thrown when database operation fails</exception>
        Task<JobOpportunity> CreateJobOpportunityAsync(JobOpportunityDto jobDto);

        /// <summary>
        /// Validates and sanitizes job opportunity data
        /// Applies business rules and data cleaning to ensure data integrity
        /// </summary>
        /// <param name="jobDto">The job opportunity data to validate and sanitize</param>
        /// <returns>A sanitized copy of the job opportunity data</returns>
        /// <exception cref="ArgumentNullException">Thrown when jobDto is null</exception>
        /// <exception cref="ArgumentException">Thrown when validation fails</exception>
        JobOpportunityDto ValidateAndSanitize(JobOpportunityDto jobDto);

        /// <summary>
        /// Creates multiple job opportunities from webhook data in bulk
        /// Validates, sanitizes, and stores multiple job opportunities in the database
        /// </summary>
        /// <param name="jobDtos">The list of job opportunity data transfer objects</param>
        /// <returns>A bulk result containing successful and failed job creations</returns>
        /// <exception cref="ArgumentNullException">Thrown when jobDtos is null</exception>
        Task<BulkJobCreationResult> CreateJobOpportunitiesBulkAsync(IEnumerable<JobOpportunityDto> jobDtos);
    }
}
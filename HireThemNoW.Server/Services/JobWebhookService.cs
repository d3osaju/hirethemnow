using HireThemNoW.Server.Data;
using HireThemNoW.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace HireThemNoW.Server.Services
{
    /// <summary>
    /// Service implementation for handling job webhook operations
    /// Handles validation, sanitization, and database operations for job opportunities
    /// </summary>
    public class JobWebhookService : IJobWebhookService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<JobWebhookService> _logger;

        public JobWebhookService(ApplicationDbContext context, ILogger<JobWebhookService> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Creates a new job opportunity from webhook data
        /// Validates, sanitizes, and stores the job opportunity in the database
        /// </summary>
        /// <param name="jobDto">The job opportunity data transfer object</param>
        /// <returns>The created JobOpportunity entity</returns>
        /// <exception cref="ArgumentNullException">Thrown when jobDto is null</exception>
        /// <exception cref="ArgumentException">Thrown when validation fails</exception>
        /// <exception cref="InvalidOperationException">Thrown when database operation fails</exception>
        public async Task<JobOpportunity> CreateJobOpportunityAsync(JobOpportunityDto jobDto)
        {
            if (jobDto == null)
            {
                _logger.LogError("JobOpportunityDto is null");
                throw new ArgumentNullException(nameof(jobDto), "Job opportunity data is required");
            }

            _logger.LogInformation("Creating job opportunity for company: {Company}, title: {JobTitle}", 
                jobDto.Company, jobDto.JobTitle);

            try
            {
                // Validate and sanitize the input data
                var sanitizedDto = ValidateAndSanitize(jobDto);

                // Create the JobOpportunity entity (excluding SecretToken for security)
                var jobOpportunity = new JobOpportunity
                {
                    JobTitle = sanitizedDto.JobTitle,
                    Company = sanitizedDto.Company,
                    Location = sanitizedDto.Location,
                    Emails = sanitizedDto.Emails,
                    EmailType = sanitizedDto.EmailType,
                    IsRemote = sanitizedDto.IsRemote,
                    Salary = sanitizedDto.Salary,
                    Link = sanitizedDto.Link,
                    Snippet = sanitizedDto.Snippet,
                    ScrapedDate = sanitizedDto.ScrapedDate ?? DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };

                // Save to database
                _context.JobOpportunities.Add(jobOpportunity);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully created job opportunity with ID: {Id} for company: {Company}", 
                    jobOpportunity.Id, jobOpportunity.Company);

                return jobOpportunity;
            }
            catch (ArgumentException)
            {
                // Re-throw validation exceptions
                throw;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error while creating job opportunity for company: {Company}", 
                    jobDto.Company);
                throw new InvalidOperationException(
                    $"Database error while creating job opportunity: {ex.Message}", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while creating job opportunity for company: {Company}", 
                    jobDto.Company);
                throw new InvalidOperationException(
                    $"Failed to create job opportunity: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Validates and sanitizes job opportunity data
        /// Applies business rules and data cleaning to ensure data integrity
        /// </summary>
        /// <param name="jobDto">The job opportunity data to validate and sanitize</param>
        /// <returns>A sanitized copy of the job opportunity data</returns>
        /// <exception cref="ArgumentNullException">Thrown when jobDto is null</exception>
        /// <exception cref="ArgumentException">Thrown when validation fails</exception>
        public JobOpportunityDto ValidateAndSanitize(JobOpportunityDto jobDto)
        {
            if (jobDto == null)
            {
                _logger.LogError("JobOpportunityDto is null during validation");
                throw new ArgumentNullException(nameof(jobDto), "Job opportunity data is required");
            }

            _logger.LogDebug("Validating job opportunity data for company: {Company}", jobDto.Company);

            // Note: SecretToken validation is handled at the controller level for security
            // Validate required fields first
            var validationErrors = JobOpportunityValidationHelper.ValidateRequiredFields(jobDto);
            if (validationErrors.Any())
            {
                var errorMessage = string.Join("; ", validationErrors);
                _logger.LogWarning("Validation failed for job opportunity: {Errors}", errorMessage);
                throw new ArgumentException($"Validation failed: {errorMessage}");
            }

            try
            {
                // Sanitize and set default values
                var sanitizedDto = JobOpportunityValidationHelper.SanitizeAndValidate(jobDto);
                sanitizedDto = JobOpportunityValidationHelper.SetDefaultValues(sanitizedDto);

                // Additional business rule validations
                ValidateBusinessRules(sanitizedDto);

                _logger.LogDebug("Successfully validated and sanitized job opportunity for company: {Company}", 
                    sanitizedDto.Company);

                return sanitizedDto;
            }
            catch (Exception ex) when (!(ex is ArgumentException))
            {
                _logger.LogError(ex, "Error during validation and sanitization for company: {Company}", 
                    jobDto.Company);
                throw new ArgumentException($"Validation error: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Validates additional business rules for job opportunities
        /// </summary>
        /// <param name="jobDto">The sanitized job opportunity data</param>
        /// <exception cref="ArgumentException">Thrown when business rules are violated</exception>
        private void ValidateBusinessRules(JobOpportunityDto jobDto)
        {
            var errors = new List<string>();

            // Validate job title length after sanitization
            if (jobDto.JobTitle.Length > 500)
            {
                errors.Add("Job title exceeds maximum length of 500 characters");
            }

            // Validate company name length after sanitization
            if (jobDto.Company.Length > 200)
            {
                errors.Add("Company name exceeds maximum length of 200 characters");
            }

            // Validate location length if provided
            if (!string.IsNullOrEmpty(jobDto.Location) && jobDto.Location.Length > 200)
            {
                errors.Add("Location exceeds maximum length of 200 characters");
            }

            // Validate salary length if provided
            if (!string.IsNullOrEmpty(jobDto.Salary) && jobDto.Salary.Length > 100)
            {
                errors.Add("Salary exceeds maximum length of 100 characters");
            }

            // Validate email type length
            if (!string.IsNullOrEmpty(jobDto.EmailType) && jobDto.EmailType.Length > 50)
            {
                errors.Add("Email type exceeds maximum length of 50 characters");
            }

            // Validate scraped date is not too far in the past (business rule)
            if (jobDto.ScrapedDate.HasValue)
            {
                var fiveYearsAgo = DateTime.UtcNow.AddYears(-5);
                if (jobDto.ScrapedDate.Value < fiveYearsAgo)
                {
                    errors.Add("Scraped date cannot be older than 5 years");
                }
            }

            if (errors.Any())
            {
                var errorMessage = string.Join("; ", errors);
                _logger.LogWarning("Business rule validation failed: {Errors}", errorMessage);
                throw new ArgumentException($"Business rule validation failed: {errorMessage}");
            }
        }
    }
}
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
            // Validate required fields
            if (string.IsNullOrWhiteSpace(jobDto.JobTitle))
            {
                _logger.LogWarning("Job title is required");
                throw new ArgumentException("Job title is required");
            }

            if (string.IsNullOrWhiteSpace(jobDto.Company))
            {
                _logger.LogWarning("Company name is required");
                throw new ArgumentException("Company name is required");
            }

            // Create a sanitized copy
            var sanitizedDto = new JobOpportunityDto
            {
                JobTitle = jobDto.JobTitle.Trim(),
                Company = jobDto.Company.Trim(),
                Location = jobDto.Location?.Trim() ?? string.Empty,
                Emails = jobDto.Emails?.Trim() ?? string.Empty,
                EmailType = string.IsNullOrEmpty(jobDto.EmailType) ? "summary" : jobDto.EmailType.Trim().ToLower(),
                IsRemote = jobDto.IsRemote,
                Salary = jobDto.Salary?.Trim() ?? string.Empty,
                Link = jobDto.Link?.Trim() ?? string.Empty,
                Snippet = jobDto.Snippet?.Trim() ?? string.Empty,
                ScrapedDate = jobDto.ScrapedDate ?? DateTime.UtcNow,
                SecretToken = jobDto.SecretToken // Keep for validation but won't be stored
            };

            // Additional business rule validations
            ValidateBusinessRules(sanitizedDto);

            _logger.LogDebug("Successfully validated and sanitized job opportunity for company: {Company}", 
                sanitizedDto.Company);

            return sanitizedDto;
        }

        /// <summary>
        /// Creates multiple job opportunities from webhook data in bulk
        /// Validates, sanitizes, and stores multiple job opportunities in the database
        /// </summary>
        /// <param name="jobDtos">The list of job opportunity data transfer objects</param>
        /// <returns>A bulk result containing successful and failed job creations</returns>
        /// <exception cref="ArgumentNullException">Thrown when jobDtos is null</exception>
        public async Task<BulkJobCreationResult> CreateJobOpportunitiesBulkAsync(IEnumerable<JobOpportunityDto> jobDtos)
        {
            if (jobDtos == null)
            {
                _logger.LogError("JobOpportunityDto list is null");
                throw new ArgumentNullException(nameof(jobDtos), "Job opportunity data list is required");
            }

            var jobList = jobDtos.ToList();
            var result = new BulkJobCreationResult
            {
                TotalProcessed = jobList.Count
            };

            _logger.LogInformation("Starting bulk job creation for {Count} jobs", jobList.Count);

            for (int i = 0; i < jobList.Count; i++)
            {
                var jobDto = jobList[i];
                try
                {
                    // Create individual job opportunity
                    var createdJob = await CreateJobOpportunityAsync(jobDto);
                    result.SuccessfulJobs.Add(createdJob);
                    result.SuccessCount++;

                    _logger.LogDebug("Successfully created job {Index}/{Total} for company: {Company}", 
                        i + 1, jobList.Count, createdJob.Company);
                }
                catch (ArgumentNullException ex)
                {
                    _logger.LogWarning("Null argument error for job {Index}: {Message}", i, ex.Message);
                    result.FailedJobs.Add(new BulkJobCreationError
                    {
                        Index = i,
                        JobData = jobDto ?? new JobOpportunityDto(),
                        ErrorMessage = ex.Message,
                        ErrorType = BulkJobErrorType.Validation
                    });
                    result.FailureCount++;
                }
                catch (ArgumentException ex)
                {
                    _logger.LogWarning("Validation error for job {Index}: {Message}", i, ex.Message);
                    result.FailedJobs.Add(new BulkJobCreationError
                    {
                        Index = i,
                        JobData = jobDto ?? new JobOpportunityDto(),
                        ErrorMessage = ex.Message,
                        ValidationErrors = new List<string> { ex.Message },
                        ErrorType = BulkJobErrorType.Validation
                    });
                    result.FailureCount++;
                }
                catch (InvalidOperationException ex)
                {
                    _logger.LogError("Database error for job {Index}: {Message}", i, ex.Message);
                    result.FailedJobs.Add(new BulkJobCreationError
                    {
                        Index = i,
                        JobData = jobDto ?? new JobOpportunityDto(),
                        ErrorMessage = "Database operation failed",
                        ErrorType = BulkJobErrorType.Database
                    });
                    result.FailureCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unexpected error for job {Index}: {Message}", i, ex.Message);
                    result.FailedJobs.Add(new BulkJobCreationError
                    {
                        Index = i,
                        JobData = jobDto ?? new JobOpportunityDto(),
                        ErrorMessage = "An unexpected error occurred",
                        ErrorType = BulkJobErrorType.Unexpected
                    });
                    result.FailureCount++;
                }
            }

            _logger.LogInformation("Bulk job creation completed. Success: {Success}, Failed: {Failed}, Total: {Total}", 
                result.SuccessCount, result.FailureCount, result.TotalProcessed);

            return result;
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
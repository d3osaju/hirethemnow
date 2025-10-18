using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace HireThemNoW.Server.Models
{
    /// <summary>
    /// Data Transfer Object for job opportunity webhook requests
    /// Used for API input validation and data sanitization
    /// </summary>
    public class JobOpportunityDto : IValidatableObject
    {
        /// <summary>
        /// Job title - required field with maximum length of 500 characters
        /// </summary>
        [Required(ErrorMessage = "Job title is required")]
        [StringLength(500, ErrorMessage = "Job title cannot exceed 500 characters")]
        public string JobTitle { get; set; } = string.Empty;

        /// <summary>
        /// Company name - required field with maximum length of 200 characters
        /// </summary>
        [Required(ErrorMessage = "Company name is required")]
        [StringLength(200, ErrorMessage = "Company name cannot exceed 200 characters")]
        public string Company { get; set; } = string.Empty;

        /// <summary>
        /// Job location - optional field with maximum length of 200 characters
        /// </summary>
        [StringLength(200, ErrorMessage = "Location cannot exceed 200 characters")]
        public string Location { get; set; } = string.Empty;

        /// <summary>
        /// Email addresses associated with the job posting
        /// </summary>
        public string Emails { get; set; } = string.Empty;

        /// <summary>
        /// Type of email contact - defaults to "summary"
        /// Allowed values: summary, detailed, instant, none, company, hr, recruiter, personal
        /// </summary>
        [StringLength(50, ErrorMessage = "Email type cannot exceed 50 characters")]
        public string EmailType { get; set; } = "summary";

        /// <summary>
        /// Indicates if the job is remote work
        /// </summary>
        public bool IsRemote { get; set; } = false;

        /// <summary>
        /// Salary information - optional field with maximum length of 100 characters
        /// </summary>
        [StringLength(100, ErrorMessage = "Salary cannot exceed 100 characters")]
        public string Salary { get; set; } = string.Empty;

        /// <summary>
        /// Link to the original job posting
        /// </summary>
        [Url(ErrorMessage = "Link must be a valid URL")]
        public string Link { get; set; } = string.Empty;

        /// <summary>
        /// Job description snippet or summary
        /// </summary>
        public string Snippet { get; set; } = string.Empty;

        /// <summary>
        /// Date when the job was scraped from the source
        /// </summary>
        public DateTime? ScrapedDate { get; set; }

        /// <summary>
        /// Secret token for webhook authentication - required for security
        /// </summary>
        [Required(ErrorMessage = "Secret token is required")]
        [StringLength(500, ErrorMessage = "Secret token cannot exceed 500 characters")]
        public string SecretToken { get; set; } = string.Empty;

        /// <summary>
        /// Custom validation logic for complex business rules
        /// </summary>
        /// <param name="validationContext">Validation context</param>
        /// <returns>Collection of validation results</returns>
        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            var results = new List<ValidationResult>();

            // Validate JobTitle is not just whitespace
            if (string.IsNullOrWhiteSpace(JobTitle))
            {
                results.Add(new ValidationResult(
                    "Job title cannot be empty or contain only whitespace",
                    new[] { nameof(JobTitle) }));
            }

            // Validate Company is not just whitespace
            if (string.IsNullOrWhiteSpace(Company))
            {
                results.Add(new ValidationResult(
                    "Company name cannot be empty or contain only whitespace",
                    new[] { nameof(Company) }));
            }

            // Validate EmailType is from allowed values
            var allowedEmailTypes = new[] { "summary", "detailed", "instant", "none", "company", "hr", "recruiter", "personal" };
            if (!string.IsNullOrEmpty(EmailType) && !allowedEmailTypes.Contains(EmailType.ToLower()))
            {
                results.Add(new ValidationResult(
                    "Email type must be one of: summary, detailed, instant, none, company, hr, recruiter, personal",
                    new[] { nameof(EmailType) }));
            }

            // Validate ScrapedDate is not in the future
            if (ScrapedDate.HasValue && ScrapedDate.Value > DateTime.UtcNow)
            {
                results.Add(new ValidationResult(
                    "Scraped date cannot be in the future",
                    new[] { nameof(ScrapedDate) }));
            }

            // Note: SecretToken validation is handled at the controller level for security
            // We don't validate the actual token value here, only that it's present (via [Required] attribute)

            // Validate emails format if provided
            if (!string.IsNullOrEmpty(Emails))
            {
                var emailPattern = @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$";
                var emails = Emails.Split(',', ';').Select(e => e.Trim());
                
                foreach (var email in emails.Where(e => !string.IsNullOrEmpty(e)))
                {
                    if (!Regex.IsMatch(email, emailPattern))
                    {
                        results.Add(new ValidationResult(
                            $"Invalid email format: {email}",
                            new[] { nameof(Emails) }));
                        break; // Only report first invalid email to avoid spam
                    }
                }
            }

            return results;
        }
    }
}
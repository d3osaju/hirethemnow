using System.Text.RegularExpressions;
using System.Web;
using HireThemNoW.Server.Models;

namespace HireThemNoW.Server.Services
{
    /// <summary>
    /// Helper class for job opportunity data validation and sanitization
    /// Provides methods for cleaning and validating job opportunity data
    /// </summary>
    public static class JobOpportunityValidationHelper
    {
        /// <summary>
        /// Sanitizes and validates a JobOpportunityDto object
        /// Cleans string inputs to prevent injection attacks and ensures data integrity
        /// </summary>
        /// <param name="dto">The JobOpportunityDto to sanitize</param>
        /// <returns>A sanitized copy of the JobOpportunityDto</returns>
        public static JobOpportunityDto SanitizeAndValidate(JobOpportunityDto dto)
        {
            if (dto == null)
                throw new ArgumentNullException(nameof(dto));

            return new JobOpportunityDto
            {
                JobTitle = SanitizeString(dto.JobTitle),
                Company = SanitizeString(dto.Company),
                Location = SanitizeString(dto.Location),
                Emails = SanitizeEmails(dto.Emails),
                EmailType = SanitizeEmailType(dto.EmailType),
                IsRemote = dto.IsRemote,
                Salary = SanitizeString(dto.Salary),
                Link = SanitizeUrl(dto.Link),
                Snippet = SanitizeString(dto.Snippet),
                ScrapedDate = ValidateScrapedDate(dto.ScrapedDate),
                SecretToken = dto.SecretToken // Pass through without sanitization for authentication
            };
        }

        /// <summary>
        /// Sanitizes a string by removing potentially harmful content
        /// Trims whitespace, removes HTML tags, and encodes special characters
        /// </summary>
        /// <param name="input">The string to sanitize</param>
        /// <returns>A sanitized string</returns>
        public static string SanitizeString(string input)
        {
            if (string.IsNullOrEmpty(input))
                return string.Empty;

            // Trim whitespace
            var sanitized = input.Trim();

            // Remove HTML tags
            sanitized = Regex.Replace(sanitized, @"<[^>]*>", string.Empty);

            // HTML encode to prevent XSS
            sanitized = HttpUtility.HtmlEncode(sanitized);

            // Remove excessive whitespace
            sanitized = Regex.Replace(sanitized, @"\s+", " ");

            // Remove null characters and other control characters
            sanitized = Regex.Replace(sanitized, @"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", string.Empty);

            return sanitized.Trim();
        }

        /// <summary>
        /// Sanitizes email addresses string
        /// Validates email format and removes invalid entries
        /// </summary>
        /// <param name="emails">Comma or semicolon separated email addresses</param>
        /// <returns>Sanitized email addresses string</returns>
        public static string SanitizeEmails(string emails)
        {
            if (string.IsNullOrEmpty(emails))
                return string.Empty;

            var emailPattern = @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$";
            var emailList = emails.Split(',', ';')
                .Select(e => SanitizeString(e))
                .Where(e => !string.IsNullOrEmpty(e) && Regex.IsMatch(e, emailPattern))
                .Distinct()
                .ToList();

            return string.Join(", ", emailList);
        }

        /// <summary>
        /// Sanitizes and validates email type
        /// Ensures email type is from allowed values
        /// </summary>
        /// <param name="emailType">The email type to validate</param>
        /// <returns>Valid email type or default "summary"</returns>
        public static string SanitizeEmailType(string emailType)
        {
            if (string.IsNullOrEmpty(emailType))
                return "summary";

            var sanitized = SanitizeString(emailType).ToLower();
            var allowedTypes = new[] { "summary", "detailed", "instant", "none" };

            return allowedTypes.Contains(sanitized) ? sanitized : "summary";
        }

        /// <summary>
        /// Sanitizes and validates URL
        /// Ensures URL is properly formatted and safe
        /// </summary>
        /// <param name="url">The URL to sanitize</param>
        /// <returns>Sanitized URL or empty string if invalid</returns>
        public static string SanitizeUrl(string url)
        {
            if (string.IsNullOrEmpty(url))
                return string.Empty;

            var sanitized = SanitizeString(url);

            // Basic URL validation
            if (Uri.TryCreate(sanitized, UriKind.Absolute, out var validUri) &&
                (validUri.Scheme == Uri.UriSchemeHttp || validUri.Scheme == Uri.UriSchemeHttps))
            {
                return validUri.ToString();
            }

            return string.Empty;
        }

        /// <summary>
        /// Validates scraped date
        /// Ensures date is not in the future and within reasonable bounds
        /// </summary>
        /// <param name="scrapedDate">The scraped date to validate</param>
        /// <returns>Valid scraped date or null if invalid</returns>
        public static DateTime? ValidateScrapedDate(DateTime? scrapedDate)
        {
            if (!scrapedDate.HasValue)
                return null;

            var date = scrapedDate.Value;
            var now = DateTime.UtcNow;

            // Don't allow future dates
            if (date > now)
                return null;

            // Don't allow dates older than 5 years (reasonable business rule)
            if (date < now.AddYears(-5))
                return null;

            return date;
        }

        /// <summary>
        /// Validates required fields are present and not empty
        /// </summary>
        /// <param name="dto">The JobOpportunityDto to validate</param>
        /// <returns>List of validation error messages</returns>
        public static List<string> ValidateRequiredFields(JobOpportunityDto dto)
        {
            var errors = new List<string>();

            if (dto == null)
            {
                errors.Add("Job opportunity data is required");
                return errors;
            }

            if (string.IsNullOrWhiteSpace(dto.JobTitle))
                errors.Add("Job title is required and cannot be empty");

            if (string.IsNullOrWhiteSpace(dto.Company))
                errors.Add("Company name is required and cannot be empty");

            return errors;
        }

        /// <summary>
        /// Sets default values for optional fields
        /// </summary>
        /// <param name="dto">The JobOpportunityDto to set defaults for</param>
        /// <returns>JobOpportunityDto with default values applied</returns>
        public static JobOpportunityDto SetDefaultValues(JobOpportunityDto dto)
        {
            if (dto == null)
                return new JobOpportunityDto();

            // Set default email type if not provided
            if (string.IsNullOrEmpty(dto.EmailType))
                dto.EmailType = "summary";

            // Ensure boolean fields have proper defaults
            // IsRemote already defaults to false in the DTO

            return dto;
        }
    }
}
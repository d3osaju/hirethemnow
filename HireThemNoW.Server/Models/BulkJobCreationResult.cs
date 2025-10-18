namespace HireThemNoW.Server.Models
{
    /// <summary>
    /// Result model for bulk job opportunity creation operations
    /// Contains information about successful and failed job creations
    /// </summary>
    public class BulkJobCreationResult
    {
        /// <summary>
        /// Total number of jobs processed
        /// </summary>
        public int TotalProcessed { get; set; }

        /// <summary>
        /// Number of jobs successfully created
        /// </summary>
        public int SuccessCount { get; set; }

        /// <summary>
        /// Number of jobs that failed to be created
        /// </summary>
        public int FailureCount { get; set; }

        /// <summary>
        /// List of successfully created job opportunities
        /// </summary>
        public List<JobOpportunity> SuccessfulJobs { get; set; } = new List<JobOpportunity>();

        /// <summary>
        /// List of failed job creation attempts with error details
        /// </summary>
        public List<BulkJobCreationError> FailedJobs { get; set; } = new List<BulkJobCreationError>();

        /// <summary>
        /// Overall success rate as a percentage
        /// </summary>
        public double SuccessRate => TotalProcessed > 0 ? (double)SuccessCount / TotalProcessed * 100 : 0;

        /// <summary>
        /// Indicates if the bulk operation was completely successful
        /// </summary>
        public bool IsCompleteSuccess => FailureCount == 0 && SuccessCount > 0;

        /// <summary>
        /// Indicates if the bulk operation had partial success
        /// </summary>
        public bool IsPartialSuccess => SuccessCount > 0 && FailureCount > 0;

        /// <summary>
        /// Indicates if the bulk operation completely failed
        /// </summary>
        public bool IsCompleteFailure => SuccessCount == 0 && FailureCount > 0;
    }

    /// <summary>
    /// Represents a failed job creation attempt in a bulk operation
    /// </summary>
    public class BulkJobCreationError
    {
        /// <summary>
        /// Index of the job in the original request array
        /// </summary>
        public int Index { get; set; }

        /// <summary>
        /// The job data that failed to be created
        /// </summary>
        public JobOpportunityDto JobData { get; set; } = new JobOpportunityDto();

        /// <summary>
        /// Error message describing why the job creation failed
        /// </summary>
        public string ErrorMessage { get; set; } = string.Empty;

        /// <summary>
        /// List of specific validation errors if applicable
        /// </summary>
        public List<string> ValidationErrors { get; set; } = new List<string>();

        /// <summary>
        /// Type of error that occurred
        /// </summary>
        public BulkJobErrorType ErrorType { get; set; }
    }

    /// <summary>
    /// Types of errors that can occur during bulk job creation
    /// </summary>
    public enum BulkJobErrorType
    {
        /// <summary>
        /// Validation error in the job data
        /// </summary>
        Validation,

        /// <summary>
        /// Database error during job creation
        /// </summary>
        Database,

        /// <summary>
        /// Authentication error (invalid secret token)
        /// </summary>
        Authentication,

        /// <summary>
        /// Unexpected error during processing
        /// </summary>
        Unexpected
    }
}
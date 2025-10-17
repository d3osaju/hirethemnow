using System.ComponentModel.DataAnnotations;

namespace HireThemNoW.Server.Models
{
    public class UpdateContactRequest
    {
        [Required(ErrorMessage = "Job title is required")]
        [MaxLength(500, ErrorMessage = "Job title cannot exceed 500 characters")]
        public string JobTitle { get; set; } = string.Empty;

        [Required(ErrorMessage = "Company name is required")]
        [MaxLength(200, ErrorMessage = "Company name cannot exceed 200 characters")]
        public string Company { get; set; } = string.Empty;

        [MaxLength(200, ErrorMessage = "Location cannot exceed 200 characters")]
        public string? Location { get; set; }

        public string? Emails { get; set; }

        [MaxLength(50, ErrorMessage = "Email type cannot exceed 50 characters")]
        public string? EmailType { get; set; }

        public bool IsRemote { get; set; }

        [MaxLength(100, ErrorMessage = "Salary cannot exceed 100 characters")]
        public string? Salary { get; set; }

        public string? Link { get; set; }

        public string? Snippet { get; set; }
    }

    public class PagedResult<T>
    {
        public List<T> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
        public bool HasNextPage => Page < TotalPages;
        public bool HasPreviousPage => Page > 1;
    }
}
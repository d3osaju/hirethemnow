namespace HireThemNoW.Server.Models;

public class Job
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Requirements { get; set; } = new();
    public string Location { get; set; } = string.Empty;
    public Salary Salary { get; set; } = new();
    public string Type { get; set; } = "full-time"; // "full-time", "part-time", "contract", "remote"
    public string EmployerId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
}

public class Salary
{
    public decimal Min { get; set; }
    public decimal Max { get; set; }
    public string Currency { get; set; } = "USD";
}

public class CreateJobRequest
{
    public string Title { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Requirements { get; set; } = new();
    public string Location { get; set; } = string.Empty;
    public Salary Salary { get; set; } = new();
    public string Type { get; set; } = "full-time";
}

public class UpdateJobRequest
{
    public string? Title { get; set; }
    public string? Company { get; set; }
    public string? Description { get; set; }
    public List<string>? Requirements { get; set; }
    public string? Location { get; set; }
    public Salary? Salary { get; set; }
    public string? Type { get; set; }
    public bool? IsActive { get; set; }
}

public class JobFilters
{
    public string? Search { get; set; }
    public string? Location { get; set; }
    public string? Type { get; set; }
    public decimal? MinSalary { get; set; }
    public decimal? MaxSalary { get; set; }
    public List<string>? Skills { get; set; }
}
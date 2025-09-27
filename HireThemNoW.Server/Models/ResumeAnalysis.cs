using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace HireThemNoW.Server.Models;

public class ResumeAnalysis
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string ResumeFileName { get; set; } = string.Empty;
    public string ResumeFilePath { get; set; } = string.Empty;

    // Document Analysis Results (JSON)
    public string AnalysisJson { get; set; } = string.Empty;

    // Parsed fields for easy querying
    public List<string> Skills { get; set; } = new();
    public List<WorkExperience> WorkExperience { get; set; } = new();
    public List<Education> Education { get; set; } = new();
    public string Summary { get; set; } = string.Empty;

    // Cold Email Templates (5 columns)
    public string ColdEmailTemplate1 { get; set; } = string.Empty;
    public string ColdEmailTemplate2 { get; set; } = string.Empty;
    public string ColdEmailTemplate3 { get; set; } = string.Empty;
    public string ColdEmailTemplate4 { get; set; } = string.Empty;
    public string ColdEmailTemplate5 { get; set; } = string.Empty;

    // Metadata
    public DateTime AnalyzedAt { get; set; } = DateTime.UtcNow;
    public string AnalysisStatus { get; set; } = "pending"; // pending, processing, completed, failed
    public string? ErrorMessage { get; set; }

    // Navigation
    public User? User { get; set; }
}

public class WorkExperience
{
    public string JobTitle { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Technologies { get; set; } = new();
}

public class Education
{
    public string Degree { get; set; } = string.Empty;
    public string Institution { get; set; } = string.Empty;
    public string Year { get; set; } = string.Empty;
    public string? GPA { get; set; }
}

// DTOs for N8N integration
public class ResumeAnalysisRequest
{
    public string UserId { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string ResumeFilePath { get; set; } = string.Empty;
    public string ResumeFileName { get; set; } = string.Empty;
}

public class ResumeAnalysisResult
{
    public string UserId { get; set; } = string.Empty;
    public DocumentAnalysis Analysis { get; set; } = new();
    public List<string> ColdEmailTemplates { get; set; } = new();
}

public class DocumentAnalysis
{
    public PersonalInfo PersonalInfo { get; set; } = new();
    public string Summary { get; set; } = string.Empty;
    public List<string> Skills { get; set; } = new();
    public List<WorkExperience> WorkExperience { get; set; } = new();
    public List<Education> Education { get; set; } = new();
    public List<string> Certifications { get; set; } = new();
    public List<string> Languages { get; set; } = new();
}

public class PersonalInfo
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string LinkedIn { get; set; } = string.Empty;
    public string GitHub { get; set; } = string.Empty;
}
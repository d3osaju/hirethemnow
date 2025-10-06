using System.Text.Json.Serialization;

namespace HireThemNoW.Server.Models;

public class StructuredResumeContent
{
    [JsonPropertyName("personalInfo")]
    public PersonalInformation? PersonalInfo { get; set; }

    [JsonPropertyName("experience")]
    public List<WorkExperience>? Experience { get; set; }

    [JsonPropertyName("education")]
    public List<Education>? Education { get; set; }

    [JsonPropertyName("skills")]
    public SkillsSection? Skills { get; set; }

    [JsonPropertyName("certifications")]
    public List<Certification>? Certifications { get; set; }

    [JsonPropertyName("summary")]
    public string? Summary { get; set; }

    [JsonPropertyName("projects")]
    public List<Project>? Projects { get; set; }
}

public class PersonalInformation
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("location")]
    public string? Location { get; set; }

    [JsonPropertyName("linkedin")]
    public string? LinkedIn { get; set; }

    [JsonPropertyName("portfolio")]
    public string? Portfolio { get; set; }

    [JsonPropertyName("github")]
    public string? GitHub { get; set; }
}

public class WorkExperience
{
    [JsonPropertyName("company")]
    public string? Company { get; set; }

    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("startDate")]
    public string? StartDate { get; set; }

    [JsonPropertyName("endDate")]
    public string? EndDate { get; set; }

    [JsonPropertyName("isCurrent")]
    public bool IsCurrent { get; set; }

    [JsonPropertyName("location")]
    public string? Location { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("achievements")]
    public List<string>? Achievements { get; set; }

    [JsonPropertyName("technologies")]
    public List<string>? Technologies { get; set; }
}

public class Education
{
    [JsonPropertyName("institution")]
    public string? Institution { get; set; }

    [JsonPropertyName("degree")]
    public string? Degree { get; set; }

    [JsonPropertyName("field")]
    public string? Field { get; set; }

    [JsonPropertyName("startDate")]
    public string? StartDate { get; set; }

    [JsonPropertyName("endDate")]
    public string? EndDate { get; set; }

    [JsonPropertyName("gpa")]
    public string? GPA { get; set; }

    [JsonPropertyName("honors")]
    public List<string>? Honors { get; set; }
}

public class SkillsSection
{
    [JsonPropertyName("technical")]
    public List<string>? Technical { get; set; }

    [JsonPropertyName("soft")]
    public List<string>? Soft { get; set; }

    [JsonPropertyName("languages")]
    public List<string>? Languages { get; set; }

    [JsonPropertyName("tools")]
    public List<string>? Tools { get; set; }
}

public class Certification
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("issuer")]
    public string? Issuer { get; set; }

    [JsonPropertyName("date")]
    public string? Date { get; set; }

    [JsonPropertyName("expirationDate")]
    public string? ExpirationDate { get; set; }

    [JsonPropertyName("credentialId")]
    public string? CredentialId { get; set; }
}

public class Project
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("technologies")]
    public List<string>? Technologies { get; set; }

    [JsonPropertyName("link")]
    public string? Link { get; set; }

    [JsonPropertyName("github")]
    public string? GitHub { get; set; }
}

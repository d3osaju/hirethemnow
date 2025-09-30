namespace HireThemNoW.Server.Models;

public class SkillExpertise
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int IndustryId { get; set; }
    public Industry Industry { get; set; } = null!;
}
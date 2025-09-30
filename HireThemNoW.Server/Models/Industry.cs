namespace HireThemNoW.Server.Models;

public class Industry
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public ICollection<SkillExpertise> Skills { get; set; } = new List<SkillExpertise>();
}
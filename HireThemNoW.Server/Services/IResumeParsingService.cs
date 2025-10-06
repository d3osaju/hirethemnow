using HireThemNoW.Server.Models;

namespace HireThemNoW.Server.Services;

public interface IResumeParsingService
{
    Task<ResumeContent> ParseResumeAsync(string userId, string s3Key, string fileName, string contentType, long fileSizeBytes);
    Task<ResumeContent?> GetLatestResumeContentAsync(string userId);
    Task<List<ResumeContent>> GetResumeHistoryAsync(string userId);
}

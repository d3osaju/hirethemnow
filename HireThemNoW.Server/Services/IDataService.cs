using HireThemNoW.Server.Models;

namespace HireThemNoW.Server.Services;

public interface IDataService
{
    // Users - Only what's actually used by controllers
    Task<User?> GetUserAsync(string id);
    Task<User?> GetUserByEmailAsync(string email);
    Task<User> CreateUserAsync(User user);
    Task<User> UpdateUserAsync(User user);
    Task<bool> DeleteUserAsync(string id);
    Task<User> CreateAdminUserAsync(string email, string name);

    // Email Preferences
    Task<EmailPreference?> GetEmailPreferencesAsync(string userId);
    Task<EmailPreference> CreateEmailPreferencesAsync(EmailPreference preferences);
    Task<EmailPreference> UpdateEmailPreferencesAsync(EmailPreference preferences);

    // Resume Content
    Task<ResumeContent> SaveResumeContentAsync(ResumeContent content);
    Task<ResumeContent?> GetLatestResumeContentAsync(string userId);
    Task<List<ResumeContent>> GetResumeContentHistoryAsync(string userId);
    Task UpdateResumeContentStatusAsync(int id, string status, string? error = null);

    // Resume Analysis
    Task<ResumeAnalysis> SaveResumeAnalysisAsync(ResumeAnalysis analysis);
    Task<ResumeAnalysis?> GetLatestResumeAnalysisAsync(string userId);
    Task<ResumeAnalysis?> GetResumeAnalysisByIdAsync(int analysisId, string userId);
    Task UpdateResumeAnalysisStatusAsync(int id, string status, string? error = null);
}
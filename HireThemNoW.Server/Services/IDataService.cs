using HireThemNoW.Server.Models;

namespace HireThemNoW.Server.Services;

public interface IDataService
{
    // Users
    Task<User?> GetUserAsync(string id);
    Task<User?> GetUserByEmailAsync(string email);
    Task<User> CreateUserAsync(User user);
    Task<User> UpdateUserAsync(User user);
    Task<bool> DeleteUserAsync(string id);

    // Jobs
    Task<List<Job>> GetJobsAsync(int page = 1, int limit = 10, JobFilters? filters = null);
    Task<Job?> GetJobAsync(string id);
    Task<Job> CreateJobAsync(Job job);
    Task<Job> UpdateJobAsync(Job job);
    Task<bool> DeleteJobAsync(string id);
    Task<int> GetJobsCountAsync(JobFilters? filters = null);

    // Applications
    Task<List<Application>> GetApplicationsAsync(string? jobId = null, string? candidateId = null);
    Task<Application?> GetApplicationAsync(string id);
    Task<Application> CreateApplicationAsync(Application application);
    Task<Application> UpdateApplicationAsync(Application application);
    Task<bool> DeleteApplicationAsync(string id);

    // Resume Analysis
    Task<ResumeAnalysis?> GetResumeAnalysisAsync(string id);
    Task<ResumeAnalysis?> GetResumeAnalysisByUserIdAsync(string userId);
    Task<ResumeAnalysis> CreateResumeAnalysisAsync(ResumeAnalysis analysis);
    Task<ResumeAnalysis> UpdateResumeAnalysisAsync(ResumeAnalysis analysis);
    Task<bool> DeleteResumeAnalysisAsync(string id);

    // HR Contacts
    Task<List<HRContact>> GetHRContactsAsync(List<string>? industries = null, List<string>? skills = null);
    Task<HRContact?> GetHRContactAsync(string id);
    Task<HRContact?> GetHRContactByEmailAsync(string email);
    Task<List<HRContact>> CreateHRContactsAsync(List<HRContact> contacts);
    Task<HRContact> UpdateHRContactAsync(HRContact contact);
    Task<bool> DeleteHRContactAsync(string id);

    // Cold Email Campaigns
    Task<List<ColdEmailCampaign>> GetColdEmailCampaignsAsync(string? userId = null);
    Task<ColdEmailCampaign?> GetColdEmailCampaignAsync(string id);
    Task<ColdEmailCampaign> CreateColdEmailCampaignAsync(ColdEmailCampaign campaign);
    Task<ColdEmailCampaign> UpdateColdEmailCampaignAsync(ColdEmailCampaign campaign);
    Task<bool> DeleteColdEmailCampaignAsync(string id);

    // Cold Email Outreach
    Task<List<ColdEmailOutreach>> GetColdEmailOutreachesAsync(string? campaignId = null);
    Task<ColdEmailOutreach?> GetColdEmailOutreachAsync(string id);
    Task<ColdEmailOutreach> CreateColdEmailOutreachAsync(ColdEmailOutreach outreach);
    Task<ColdEmailOutreach> UpdateColdEmailOutreachAsync(ColdEmailOutreach outreach);
    Task<bool> DeleteColdEmailOutreachAsync(string id);

    // Email Analysis
    Task<EmailAnalysis?> GetEmailAnalysisAsync(string id);
    Task<EmailAnalysis?> GetEmailAnalysisByOutreachIdAsync(string outreachId);
    Task<EmailAnalysis> CreateEmailAnalysisAsync(EmailAnalysis analysis);
    Task<EmailAnalysis> UpdateEmailAnalysisAsync(EmailAnalysis analysis);
    Task<bool> DeleteEmailAnalysisAsync(string id);

    // Mailbox - Get emails for user dashboard
    Task<List<ColdEmailOutreach>> GetUserEmailsAsync(string userId);
}
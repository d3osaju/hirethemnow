namespace HireThemNoW.Server.Services
{
    public interface IEmailService
    {
        Task SendAnalysisCompleteEmailAsync(string userId, string toEmail, string userName, int atsScore, List<string> topRecommendations);
        Task SendParsingCompleteEmailAsync(string userId, string toEmail, string userName);
        Task SendAnalysisFailedEmailAsync(string userId, string toEmail, string userName, string errorMessage);
        Task SendResumeAnalysisCompleteEmailAsync(string toEmail, string userName, int atsScore);
        Task SendEmailAsync(string toEmail, string subject, string htmlBody);
    }
}

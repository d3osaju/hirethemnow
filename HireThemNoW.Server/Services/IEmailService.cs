namespace HireThemNoW.Server.Services
{
    public interface IEmailService
    {
        Task SendResumeAnalysisCompleteEmailAsync(string toEmail, string userName, int atsScore);
        Task SendEmailAsync(string toEmail, string subject, string htmlBody);
    }
}

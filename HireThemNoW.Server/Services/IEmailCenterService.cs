using HireThemNoW.Server.Models;

namespace HireThemNoW.Server.Services
{
    public interface IEmailCenterService
    {
        Task<List<Email>> GetUserUnsentEmailsAsync(string userId);
        Task<bool> MarkEmailAsSentAsync(int emailId, string userId);
        Task<Email> CreateEmailAsync(WebhookEmailRequest request);
        Task<bool> ValidateWebhookRequestAsync(WebhookEmailRequest request);
    }
}
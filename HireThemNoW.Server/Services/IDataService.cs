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

    // Email Preferences
    Task<EmailPreference?> GetEmailPreferencesAsync(string userId);
    Task<EmailPreference> CreateEmailPreferencesAsync(EmailPreference preferences);
    Task<EmailPreference> UpdateEmailPreferencesAsync(EmailPreference preferences);
}
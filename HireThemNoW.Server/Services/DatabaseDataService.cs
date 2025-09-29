using HireThemNoW.Server.Models;
using HireThemNoW.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace HireThemNoW.Server.Services;

public class DatabaseDataService : IDataService
{
    private readonly ApplicationDbContext _context;

    public DatabaseDataService(ApplicationDbContext context)
    {
        _context = context;
    }

    // Users - Only what's actually used by controllers
    public async Task<User?> GetUserAsync(string id)
    {
        return await _context.Users.FindAsync(id);
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<User> CreateUserAsync(User user)
    {
        user.Id = Guid.NewGuid().ToString();
        user.CreatedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;

        // Set 7-day free trial for all new users
        user.TrialStartDate = DateTime.UtcNow;
        user.TrialEndDate = DateTime.UtcNow.AddDays(7);
        user.IsTrialActive = true;
        user.HasSeenTrialEndMessage = false;

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<User> UpdateUserAsync(User user)
    {
        user.UpdatedAt = DateTime.UtcNow;
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<bool> DeleteUserAsync(string id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return false;

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return true;
    }

    // Email Preferences
    public async Task<EmailPreference?> GetEmailPreferencesAsync(string userId)
    {
        return await _context.EmailPreferences.FirstOrDefaultAsync(ep => ep.UserId == userId);
    }

    public async Task<EmailPreference> CreateEmailPreferencesAsync(EmailPreference preferences)
    {
        preferences.Id = Guid.NewGuid().ToString();
        preferences.CreatedAt = DateTime.UtcNow;
        preferences.UpdatedAt = DateTime.UtcNow;

        _context.EmailPreferences.Add(preferences);
        await _context.SaveChangesAsync();
        return preferences;
    }

    public async Task<EmailPreference> UpdateEmailPreferencesAsync(EmailPreference preferences)
    {
        preferences.UpdatedAt = DateTime.UtcNow;
        _context.EmailPreferences.Update(preferences);
        await _context.SaveChangesAsync();
        return preferences;
    }
}
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

    // Resume Content
    public async Task<ResumeContent> SaveResumeContentAsync(ResumeContent content)
    {
        if (content == null)
        {
            throw new ArgumentNullException(nameof(content), "Resume content cannot be null");
        }

        if (string.IsNullOrWhiteSpace(content.UserId))
        {
            throw new ArgumentException("User ID is required", nameof(content));
        }

        try
        {
            content.CreatedAt = DateTime.UtcNow;
            content.UpdatedAt = DateTime.UtcNow;

            _context.ResumeContents.Add(content);
            await _context.SaveChangesAsync();
            return content;
        }
        catch (DbUpdateException ex)
        {
            throw new InvalidOperationException(
                $"Database error while saving resume content for user {content.UserId}: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException(
                $"Failed to save resume content for user {content.UserId}: {ex.Message}", ex);
        }
    }

    public async Task<ResumeContent?> GetLatestResumeContentAsync(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("User ID is required", nameof(userId));
        }

        try
        {
            return await _context.ResumeContents
                .Where(rc => rc.UserId == userId)
                .OrderByDescending(rc => rc.UploadedAt)
                .FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException(
                $"Failed to retrieve latest resume content for user {userId}: {ex.Message}", ex);
        }
    }

    public async Task<List<ResumeContent>> GetResumeContentHistoryAsync(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("User ID is required", nameof(userId));
        }

        try
        {
            return await _context.ResumeContents
                .Where(rc => rc.UserId == userId)
                .OrderByDescending(rc => rc.UploadedAt)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException(
                $"Failed to retrieve resume content history for user {userId}: {ex.Message}", ex);
        }
    }

    public async Task UpdateResumeContentStatusAsync(int id, string status, string? error = null)
    {
        if (id <= 0)
        {
            throw new ArgumentException("Invalid resume content ID", nameof(id));
        }

        if (string.IsNullOrWhiteSpace(status))
        {
            throw new ArgumentException("Status is required", nameof(status));
        }

        try
        {
            var content = await _context.ResumeContents.FindAsync(id);
            if (content == null)
            {
                throw new InvalidOperationException($"Resume content with ID {id} not found");
            }

            content.ParsingStatus = status;
            content.ParsingError = error;
            content.UpdatedAt = DateTime.UtcNow;

            if (status == "completed")
            {
                content.ParsedAt = DateTime.UtcNow;
            }

            _context.ResumeContents.Update(content);
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            throw new InvalidOperationException(
                $"Database error while updating resume content status for ID {id}: {ex.Message}", ex);
        }
        catch (InvalidOperationException)
        {
            throw; // Re-throw if it's already our custom exception
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException(
                $"Failed to update resume content status for ID {id}: {ex.Message}", ex);
        }
    }

    // Resume Analysis
    public async Task<ResumeAnalysis> SaveResumeAnalysisAsync(ResumeAnalysis analysis)
    {
        if (analysis == null)
        {
            throw new ArgumentNullException(nameof(analysis), "Resume analysis cannot be null");
        }

        if (string.IsNullOrWhiteSpace(analysis.UserId))
        {
            throw new ArgumentException("User ID is required", nameof(analysis));
        }

        try
        {
            // Check if this is an update (existing ID) or insert (new record)
            var isUpdate = analysis.Id > 0;
            
            if (isUpdate)
            {
                // Update existing record
                analysis.UpdatedAt = DateTime.UtcNow;
                _context.ResumeAnalyses.Update(analysis);
            }
            else
            {
                // Insert new record
                analysis.CreatedAt = DateTime.UtcNow;
                analysis.UpdatedAt = DateTime.UtcNow;
                _context.ResumeAnalyses.Add(analysis);
            }

            await _context.SaveChangesAsync();
            return analysis;
        }
        catch (DbUpdateException ex)
        {
            throw new InvalidOperationException(
                $"Database error while saving resume analysis for user {analysis.UserId}: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException(
                $"Failed to save resume analysis for user {analysis.UserId}: {ex.Message}", ex);
        }
    }

    public async Task<ResumeAnalysis?> GetLatestResumeAnalysisAsync(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("User ID is required", nameof(userId));
        }

        try
        {
            return await _context.ResumeAnalyses
                .Where(ra => ra.UserId == userId)
                .OrderByDescending(ra => ra.CreatedAt)
                .FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException(
                $"Failed to retrieve latest resume analysis for user {userId}: {ex.Message}", ex);
        }
    }

    public async Task<ResumeAnalysis?> GetResumeAnalysisByIdAsync(int analysisId, string userId)
    {
        if (analysisId <= 0)
        {
            throw new ArgumentException("Invalid analysis ID", nameof(analysisId));
        }

        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("User ID is required", nameof(userId));
        }

        try
        {
            // Query by analysis ID and include user verification
            return await _context.ResumeAnalyses
                .FirstOrDefaultAsync(ra => ra.Id == analysisId && ra.UserId == userId);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException(
                $"Failed to retrieve resume analysis with ID {analysisId} for user {userId}: {ex.Message}", ex);
        }
    }

    public async Task UpdateResumeAnalysisStatusAsync(int id, string status, string? error = null)
    {
        if (id <= 0)
        {
            throw new ArgumentException("Invalid resume analysis ID", nameof(id));
        }

        if (string.IsNullOrWhiteSpace(status))
        {
            throw new ArgumentException("Status is required", nameof(status));
        }

        try
        {
            var analysis = await _context.ResumeAnalyses.FindAsync(id);
            if (analysis == null)
            {
                throw new InvalidOperationException($"Resume analysis with ID {id} not found");
            }

            analysis.Status = status;
            analysis.AnalysisError = error;
            analysis.UpdatedAt = DateTime.UtcNow;

            if (status == "completed")
            {
                analysis.ProcessedAt = DateTime.UtcNow;
            }

            _context.ResumeAnalyses.Update(analysis);
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            throw new InvalidOperationException(
                $"Database error while updating resume analysis status for ID {id}: {ex.Message}", ex);
        }
        catch (InvalidOperationException)
        {
            throw; // Re-throw if it's already our custom exception
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException(
                $"Failed to update resume analysis status for ID {id}: {ex.Message}", ex);
        }
    }
}
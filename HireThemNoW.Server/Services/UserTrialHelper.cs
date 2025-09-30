using HireThemNoW.Server.Models;

namespace HireThemNoW.Server.Services;

public static class UserTrialHelper
{
    /// <summary>
    /// Ensures user has valid trial dates. Call this for existing users who might not have trial fields set.
    /// </summary>
    public static void EnsureTrialDatesSet(User user)
    {
        // Check if trial dates are not set (default DateTime values)
        if (user.TrialStartDate == DateTime.MinValue || user.TrialStartDate.Year < 2024)
        {
            user.TrialStartDate = DateTime.UtcNow;
            user.TrialEndDate = DateTime.UtcNow.AddDays(7);
            user.IsTrialActive = true;
            user.HasSeenTrialEndMessage = false;
        }
    }
}
using HireThemNoW.Server.Models;
using HireThemNoW.Server.Models.DTOs;

namespace HireThemNoW.Server.Services;

public class EmailAnalyticsService : IEmailAnalyticsService
{
    private readonly IDataService _dataService;

    public EmailAnalyticsService(IDataService dataService)
    {
        _dataService = dataService;
    }

    public async Task<EmailAnalyticsDto> GetEmailAnalyticsAsync(string userId, EmailAnalyticsFilter? filter = null)
    {
        var emailsSent = await _dataService.GetEmailsSentAsync(userId);
        var emailsReceived = await _dataService.GetEmailsReceivedAsync(userId);

        // Apply filters if provided
        if (filter != null)
        {
            emailsSent = ApplyFiltersToSent(emailsSent, filter);
            emailsReceived = ApplyFiltersToReceived(emailsReceived, filter);
        }

        var campaignSummary = await CalculateCampaignSummary(emailsSent, emailsReceived, filter?.CampaignId);
        var performanceMetrics = await CalculatePerformanceMetrics(emailsSent, emailsReceived, filter);
        var responseAnalytics = await CalculateResponseAnalytics(emailsReceived, filter);
        var emailTrends = await CalculateEmailTrends(emailsSent, emailsReceived, filter);
        var engagementStats = await CalculateEngagementStats(emailsReceived, filter);

        return new EmailAnalyticsDto
        {
            CampaignSummary = campaignSummary,
            PerformanceMetrics = performanceMetrics,
            ResponseAnalytics = responseAnalytics,
            EmailTrends = emailTrends,
            EngagementStats = engagementStats
        };
    }

    public async Task<List<CampaignComparisonDto>> GetCampaignComparisonAsync(string userId, List<string>? campaignIds = null)
    {
        var emailsSent = await _dataService.GetEmailsSentAsync(userId);
        var emailsReceived = await _dataService.GetEmailsReceivedAsync(userId);

        var campaigns = campaignIds?.Any() == true
            ? emailsSent.Where(e => campaignIds.Contains(e.CampaignId ?? "")).GroupBy(e => e.CampaignId).ToList()
            : emailsSent.GroupBy(e => e.CampaignId).ToList();

        var result = new List<CampaignComparisonDto>();

        foreach (var campaign in campaigns)
        {
            var campaignEmails = campaign.ToList();
            var campaignReplies = emailsReceived.Where(r => campaignEmails.Any(s => s.Id == r.OriginalEmailId)).ToList();

            var summary = await CalculateCampaignSummary(campaignEmails, campaignReplies, campaign.Key);

            var comparison = new CampaignComparisonDto
            {
                CampaignId = campaign.Key ?? "unknown",
                CampaignName = campaign.Key ?? "Unknown Campaign",
                StartDate = campaignEmails.Min(e => e.DateSent),
                EndDate = campaignEmails.Max(e => e.DateSent),
                Summary = summary,
                TopPerformingSubjects = GetTopPerformingSubjects(campaignEmails, campaignReplies),
                TopRespondingCompanies = GetTopRespondingCompanies(campaignReplies)
            };

            result.Add(comparison);
        }

        return result.OrderByDescending(c => c.Summary.ResponseRate).ToList();
    }

    public async Task<EmailCampaignSummary> GetCampaignSummaryAsync(string userId, string? campaignId = null)
    {
        var emailsSent = await _dataService.GetEmailsSentAsync(userId, campaignId);
        var emailsReceived = await _dataService.GetEmailsReceivedAsync(userId);

        if (!string.IsNullOrEmpty(campaignId))
        {
            var sentEmailIds = emailsSent.Select(e => e.Id).ToHashSet();
            emailsReceived = emailsReceived.Where(r => sentEmailIds.Contains(r.OriginalEmailId ?? "")).ToList();
        }

        return await CalculateCampaignSummary(emailsSent, emailsReceived, campaignId);
    }

    public async Task<List<EmailPerformanceMetric>> GetPerformanceMetricsAsync(string userId, EmailAnalyticsFilter? filter = null)
    {
        var emailsSent = await _dataService.GetEmailsSentAsync(userId);
        var emailsReceived = await _dataService.GetEmailsReceivedAsync(userId);

        if (filter != null)
        {
            emailsSent = ApplyFiltersToSent(emailsSent, filter);
            emailsReceived = ApplyFiltersToReceived(emailsReceived, filter);
        }

        return await CalculatePerformanceMetrics(emailsSent, emailsReceived, filter);
    }

    public async Task<List<ResponseAnalytic>> GetResponseAnalyticsAsync(string userId, EmailAnalyticsFilter? filter = null)
    {
        var emailsReceived = await _dataService.GetEmailsReceivedAsync(userId);

        if (filter != null)
        {
            emailsReceived = ApplyFiltersToReceived(emailsReceived, filter);
        }

        return await CalculateResponseAnalytics(emailsReceived, filter);
    }

    public async Task<List<TimeSeriesData>> GetEmailTrendsAsync(string userId, EmailAnalyticsFilter? filter = null)
    {
        var emailsSent = await _dataService.GetEmailsSentAsync(userId);
        var emailsReceived = await _dataService.GetEmailsReceivedAsync(userId);

        if (filter != null)
        {
            emailsSent = ApplyFiltersToSent(emailsSent, filter);
            emailsReceived = ApplyFiltersToReceived(emailsReceived, filter);
        }

        return await CalculateEmailTrends(emailsSent, emailsReceived, filter);
    }

    public async Task<EmailEngagementStats> GetEngagementStatsAsync(string userId, EmailAnalyticsFilter? filter = null)
    {
        var emailsReceived = await _dataService.GetEmailsReceivedAsync(userId);

        if (filter != null)
        {
            emailsReceived = ApplyFiltersToReceived(emailsReceived, filter);
        }

        return await CalculateEngagementStats(emailsReceived, filter);
    }

    // Helper methods
    private List<EmailSent> ApplyFiltersToSent(List<EmailSent> emails, EmailAnalyticsFilter filter)
    {
        if (filter.StartDate.HasValue)
            emails = emails.Where(e => e.DateSent >= filter.StartDate.Value).ToList();

        if (filter.EndDate.HasValue)
            emails = emails.Where(e => e.DateSent <= filter.EndDate.Value).ToList();

        if (!string.IsNullOrEmpty(filter.CampaignId))
            emails = emails.Where(e => e.CampaignId == filter.CampaignId).ToList();

        if (!string.IsNullOrEmpty(filter.Status))
            emails = emails.Where(e => e.Status == filter.Status).ToList();

        if (!string.IsNullOrEmpty(filter.Domain))
            emails = emails.Where(e => e.ToEmail.Contains($"@{filter.Domain}")).ToList();

        return emails;
    }

    private List<EmailReceived> ApplyFiltersToReceived(List<EmailReceived> emails, EmailAnalyticsFilter filter)
    {
        if (filter.StartDate.HasValue)
            emails = emails.Where(e => e.DateReceived >= filter.StartDate.Value).ToList();

        if (filter.EndDate.HasValue)
            emails = emails.Where(e => e.DateReceived <= filter.EndDate.Value).ToList();

        if (!string.IsNullOrEmpty(filter.ResponseType))
            emails = emails.Where(e => e.ReplyType == filter.ResponseType).ToList();

        if (!string.IsNullOrEmpty(filter.Status))
            emails = emails.Where(e => e.Status == filter.Status).ToList();

        if (!string.IsNullOrEmpty(filter.Domain))
            emails = emails.Where(e => e.FromEmail.Contains($"@{filter.Domain}")).ToList();

        if (!filter.IncludeAutoReplies)
            emails = emails.Where(e => !e.IsAutoReply).ToList();

        return emails;
    }

    private Task<EmailCampaignSummary> CalculateCampaignSummary(List<EmailSent> emailsSent, List<EmailReceived> emailsReceived, string? campaignId)
    {
        var totalSent = emailsSent.Count;
        var totalReceived = emailsReceived.Count;
        var positiveResponses = emailsReceived.Count(e => e.IsPositiveResponse);
        var rejections = emailsReceived.Count(e => e.IsRejection);
        var interviews = emailsReceived.Count(e => e.HasInterviewInvitation);
        var pendingResponses = emailsReceived.Count(e => e.Status == "pending");
        var noResponses = totalSent - totalReceived;

        var responseRate = totalSent > 0 ? (double)totalReceived / totalSent * 100 : 0;
        var positiveResponseRate = totalReceived > 0 ? (double)positiveResponses / totalReceived * 100 : 0;
        var interviewRate = totalReceived > 0 ? (double)interviews / totalReceived * 100 : 0;
        var rejectionRate = totalReceived > 0 ? (double)rejections / totalReceived * 100 : 0;

        return Task.FromResult(new EmailCampaignSummary
        {
            TotalEmailsSent = totalSent,
            TotalEmailsReceived = totalReceived,
            TotalReplies = totalReceived,
            PositiveResponses = positiveResponses,
            Rejections = rejections,
            InterviewInvitations = interviews,
            PendingResponses = pendingResponses,
            NoResponses = noResponses,
            ResponseRate = Math.Round(responseRate, 2),
            PositiveResponseRate = Math.Round(positiveResponseRate, 2),
            InterviewRate = Math.Round(interviewRate, 2),
            RejectionRate = Math.Round(rejectionRate, 2),
            FirstEmailSent = emailsSent.Any() ? emailsSent.Min(e => e.DateSent) : null,
            LastEmailSent = emailsSent.Any() ? emailsSent.Max(e => e.DateSent) : null,
            LastResponseReceived = emailsReceived.Any() ? emailsReceived.Max(e => e.DateReceived) : null
        });
    }

    private Task<List<EmailPerformanceMetric>> CalculatePerformanceMetrics(List<EmailSent> emailsSent, List<EmailReceived> emailsReceived, EmailAnalyticsFilter? filter)
    {
        var groupBy = filter?.GroupBy ?? "day";
        var result = new List<EmailPerformanceMetric>();

        IEnumerable<IGrouping<object, EmailSent>> grouped;

        switch (groupBy.ToLower())
        {
            case "week":
                grouped = emailsSent.GroupBy(e => new { Year = e.DateSent.Year, Week = GetWeekOfYear(e.DateSent) } as object);
                break;
            case "month":
                grouped = emailsSent.GroupBy(e => new { e.DateSent.Year, e.DateSent.Month } as object);
                break;
            default:
                grouped = emailsSent.GroupBy(e => e.DateSent.Date as object);
                break;
        }

        foreach (var group in grouped)
        {
            var sentInPeriod = group.ToList();
            var sentIds = sentInPeriod.Select(e => e.Id).ToHashSet();
            var receivedInPeriod = emailsReceived.Where(r => sentIds.Contains(r.OriginalEmailId ?? "")).ToList();

            DateTime date;
            switch (groupBy.ToLower())
            {
                case "week":
                    var weekKey = (dynamic)group.Key;
                    date = GetDateFromYearWeek(weekKey.Year, weekKey.Week);
                    break;
                case "month":
                    var monthKey = (dynamic)group.Key;
                    date = new DateTime(monthKey.Year, monthKey.Month, 1);
                    break;
                default:
                    date = (DateTime)group.Key;
                    break;
            }

            var metric = new EmailPerformanceMetric
            {
                Period = groupBy,
                Date = date,
                EmailsSent = sentInPeriod.Count,
                EmailsReceived = receivedInPeriod.Count,
                Replies = receivedInPeriod.Count,
                PositiveResponses = receivedInPeriod.Count(r => r.IsPositiveResponse),
                Rejections = receivedInPeriod.Count(r => r.IsRejection),
                InterviewInvitations = receivedInPeriod.Count(r => r.HasInterviewInvitation),
                ResponseRate = sentInPeriod.Count > 0 ? Math.Round((double)receivedInPeriod.Count / sentInPeriod.Count * 100, 2) : 0,
                PositiveRate = receivedInPeriod.Count > 0 ? Math.Round((double)receivedInPeriod.Count(r => r.IsPositiveResponse) / receivedInPeriod.Count * 100, 2) : 0
            };

            result.Add(metric);
        }

        return Task.FromResult(result.OrderBy(m => m.Date).ToList());
    }

    private Task<List<ResponseAnalytic>> CalculateResponseAnalytics(List<EmailReceived> emailsReceived, EmailAnalyticsFilter? filter)
    {
        var responseTypes = emailsReceived.GroupBy(e => e.ReplyType ?? "unknown").ToList();
        var total = emailsReceived.Count;

        var result = new List<ResponseAnalytic>();

        foreach (var group in responseTypes)
        {
            var responses = group.ToList();
            var count = responses.Count;
            var percentage = total > 0 ? Math.Round((double)count / total * 100, 2) : 0;

            // Calculate average response time
            var responseTimes = responses
                .Where(r => r.DateSent.HasValue)
                .Select(r => (r.DateReceived - r.DateSent!.Value).TotalHours)
                .ToList();

            var avgResponseTime = responseTimes.Any() ? Math.Round(responseTimes.Average(), 2) : 0;

            // Extract common keywords (simplified - you might want to use NLP here)
            var keywords = responses
                .SelectMany(r => ExtractKeywords(r.EmailContentText ?? r.EmailContentHtml))
                .GroupBy(k => k)
                .OrderByDescending(g => g.Count())
                .Take(5)
                .Select(g => g.Key)
                .ToList();

            var analytic = new ResponseAnalytic
            {
                ResponseType = group.Key,
                Count = count,
                Percentage = percentage,
                CommonKeywords = keywords,
                AverageResponseTime = avgResponseTime
            };

            result.Add(analytic);
        }

        return Task.FromResult(result.OrderByDescending(r => r.Percentage).ToList());
    }

    private Task<List<TimeSeriesData>> CalculateEmailTrends(List<EmailSent> emailsSent, List<EmailReceived> emailsReceived, EmailAnalyticsFilter? filter)
    {
        var result = new List<TimeSeriesData>();

        // Emails sent trend
        var sentTrend = emailsSent.GroupBy(e => e.DateSent.Date)
            .Select(g => new TimeSeriesData
            {
                Date = g.Key,
                Label = "Emails Sent",
                Value = g.Count(),
                Category = "sent"
            });

        // Emails received trend
        var receivedTrend = emailsReceived.GroupBy(e => e.DateReceived.Date)
            .Select(g => new TimeSeriesData
            {
                Date = g.Key,
                Label = "Emails Received",
                Value = g.Count(),
                Category = "received"
            });

        // Positive responses trend
        var positiveTrend = emailsReceived.Where(e => e.IsPositiveResponse)
            .GroupBy(e => e.DateReceived.Date)
            .Select(g => new TimeSeriesData
            {
                Date = g.Key,
                Label = "Positive Responses",
                Value = g.Count(),
                Category = "positive"
            });

        // Rejections trend
        var rejectionTrend = emailsReceived.Where(e => e.IsRejection)
            .GroupBy(e => e.DateReceived.Date)
            .Select(g => new TimeSeriesData
            {
                Date = g.Key,
                Label = "Rejections",
                Value = g.Count(),
                Category = "negative"
            });

        result.AddRange(sentTrend);
        result.AddRange(receivedTrend);
        result.AddRange(positiveTrend);
        result.AddRange(rejectionTrend);

        return Task.FromResult(result.OrderBy(t => t.Date).ToList());
    }

    private Task<EmailEngagementStats> CalculateEngagementStats(List<EmailReceived> emailsReceived, EmailAnalyticsFilter? filter)
    {
        // Calculate response times
        var responseTimes = emailsReceived
            .Where(r => r.DateSent.HasValue)
            .Select(r => (r.DateReceived - r.DateSent!.Value).TotalHours)
            .ToList();

        var avgResponseTime = responseTimes.Any() ? Math.Round(responseTimes.Average(), 2) : 0;

        // Quick and slow responses
        var quickResponses = emailsReceived.Count(r => r.DateSent.HasValue && (r.DateReceived - r.DateSent!.Value).TotalHours <= 24);
        var slowResponses = emailsReceived.Count(r => r.DateSent.HasValue && (r.DateReceived - r.DateSent!.Value).TotalDays > 7);

        // Responses by day of week
        var responsesByDayOfWeek = emailsReceived
            .GroupBy(r => r.DateReceived.DayOfWeek.ToString())
            .ToDictionary(g => g.Key, g => g.Count());

        // Responses by hour of day
        var responsesByHourOfDay = emailsReceived
            .GroupBy(r => r.DateReceived.Hour.ToString())
            .ToDictionary(g => g.Key, g => g.Count());

        // Top domains
        var topDomains = emailsReceived
            .Where(r => !string.IsNullOrEmpty(r.FromEmail))
            .GroupBy(r => r.FromEmail.Split('@').LastOrDefault() ?? "unknown")
            .OrderByDescending(g => g.Count())
            .Take(10)
            .ToDictionary(g => g.Key, g => g.Count());

        return Task.FromResult(new EmailEngagementStats
        {
            AverageResponseTimeHours = avgResponseTime,
            EmailsWithNoResponse = 0, // This would need to be calculated from sent emails without responses
            EmailsWithQuickResponse = quickResponses,
            EmailsWithSlowResponse = slowResponses,
            ResponsesByDayOfWeek = responsesByDayOfWeek,
            ResponsesByHourOfDay = responsesByHourOfDay,
            TopDomains = topDomains
        });
    }

    // Utility methods
    private List<string> GetTopPerformingSubjects(List<EmailSent> sentEmails, List<EmailReceived> receivedEmails)
    {
        var sentEmailIds = receivedEmails.Select(r => r.OriginalEmailId).ToHashSet();
        return sentEmails
            .Where(s => sentEmailIds.Contains(s.Id))
            .GroupBy(s => s.Subject)
            .OrderByDescending(g => g.Count())
            .Take(5)
            .Select(g => g.Key)
            .ToList();
    }

    private List<string> GetTopRespondingCompanies(List<EmailReceived> receivedEmails)
    {
        return receivedEmails
            .Where(r => !string.IsNullOrEmpty(r.FromEmail))
            .GroupBy(r => r.FromEmail.Split('@').LastOrDefault() ?? "unknown")
            .OrderByDescending(g => g.Count())
            .Take(5)
            .Select(g => g.Key)
            .ToList();
    }

    private List<string> ExtractKeywords(string content)
    {
        if (string.IsNullOrEmpty(content)) return new List<string>();

        // Simple keyword extraction - remove HTML, split by common delimiters, filter common words
        var commonWords = new HashSet<string> { "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "a", "an", "is", "are", "was", "were", "be", "been", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "can" };

        var cleanContent = System.Text.RegularExpressions.Regex.Replace(content, "<.*?>", " ");
        return cleanContent
            .Split(new char[] { ' ', '\n', '\r', '\t', '.', ',', '!', '?', ';', ':' }, StringSplitOptions.RemoveEmptyEntries)
            .Where(word => word.Length > 3 && !commonWords.Contains(word.ToLower()))
            .Select(word => word.ToLower())
            .Distinct()
            .ToList();
    }

    private int GetWeekOfYear(DateTime date)
    {
        var culture = System.Globalization.CultureInfo.CurrentCulture;
        return culture.Calendar.GetWeekOfYear(date, culture.DateTimeFormat.CalendarWeekRule, culture.DateTimeFormat.FirstDayOfWeek);
    }

    private DateTime GetDateFromYearWeek(int year, int week)
    {
        var jan1 = new DateTime(year, 1, 1);
        var daysOffset = (int)System.Globalization.CultureInfo.CurrentCulture.DateTimeFormat.FirstDayOfWeek - (int)jan1.DayOfWeek;
        var firstWeek = jan1.AddDays(daysOffset);
        return firstWeek.AddDays((week - 1) * 7);
    }
}
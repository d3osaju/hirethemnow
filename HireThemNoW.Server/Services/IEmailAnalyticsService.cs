using HireThemNoW.Server.Models.DTOs;

namespace HireThemNoW.Server.Services;

public interface IEmailAnalyticsService
{
    Task<EmailAnalyticsDto> GetEmailAnalyticsAsync(string userId, EmailAnalyticsFilter? filter = null);
    Task<List<CampaignComparisonDto>> GetCampaignComparisonAsync(string userId, List<string>? campaignIds = null);
    Task<EmailCampaignSummary> GetCampaignSummaryAsync(string userId, string? campaignId = null);
    Task<List<EmailPerformanceMetric>> GetPerformanceMetricsAsync(string userId, EmailAnalyticsFilter? filter = null);
    Task<List<ResponseAnalytic>> GetResponseAnalyticsAsync(string userId, EmailAnalyticsFilter? filter = null);
    Task<List<TimeSeriesData>> GetEmailTrendsAsync(string userId, EmailAnalyticsFilter? filter = null);
    Task<EmailEngagementStats> GetEngagementStatsAsync(string userId, EmailAnalyticsFilter? filter = null);
}
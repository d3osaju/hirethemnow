using HireThemNoW.Server.Models;
using System.Collections.Concurrent;

namespace HireThemNoW.Server.Services;

public class InMemoryDataService : IDataService
{
    private readonly ConcurrentDictionary<string, User> _users = new();
    private readonly ConcurrentDictionary<string, Job> _jobs = new();
    private readonly ConcurrentDictionary<string, Application> _applications = new();
    private readonly ConcurrentDictionary<string, ResumeAnalysis> _resumeAnalyses = new();
    private readonly ConcurrentDictionary<string, HRContact> _hrContacts = new();
    private readonly ConcurrentDictionary<string, ColdEmailCampaign> _coldEmailCampaigns = new();
    private readonly ConcurrentDictionary<string, ColdEmailOutreach> _coldEmailOutreaches = new();
    private readonly ConcurrentDictionary<string, EmailAnalysis> _emailAnalyses = new();
    private readonly ConcurrentDictionary<string, EmailSent> _emailsSent = new();
    private readonly ConcurrentDictionary<string, EmailReceived> _emailsReceived = new();

    public InMemoryDataService()
    {
        SeedData();
    }

    private void SeedData()
    {
        // Seed sample jobs
        var sampleJobs = new List<Job>
        {
            new Job
            {
                Id = "1",
                Title = "Senior Frontend Developer",
                Company = "TechCorp Inc.",
                Description = "We are looking for a skilled Frontend Developer with React experience to join our dynamic team.",
                Requirements = new List<string> { "React", "TypeScript", "CSS", "3+ years experience" },
                Location = "San Francisco, CA",
                Salary = new Salary { Min = 100000, Max = 150000, Currency = "USD" },
                Type = "full-time",
                EmployerId = "emp1",
                CreatedAt = DateTime.UtcNow.AddDays(-15),
                UpdatedAt = DateTime.UtcNow.AddDays(-15)
            },
            new Job
            {
                Id = "2",
                Title = "Backend Engineer",
                Company = "StartupXYZ",
                Description = "Join our growing team as a Backend Engineer working with Node.js, AWS, and modern technologies.",
                Requirements = new List<string> { "Node.js", "AWS", "MongoDB", "2+ years experience" },
                Location = "Remote",
                Salary = new Salary { Min = 80000, Max = 120000, Currency = "USD" },
                Type = "remote",
                EmployerId = "emp2",
                CreatedAt = DateTime.UtcNow.AddDays(-10),
                UpdatedAt = DateTime.UtcNow.AddDays(-10)
            },
            new Job
            {
                Id = "3",
                Title = "Product Manager",
                Company = "InnovateLabs",
                Description = "Lead product strategy and work with cross-functional teams to deliver exceptional user experiences.",
                Requirements = new List<string> { "Product Management", "Agile", "Analytics", "5+ years experience" },
                Location = "New York, NY",
                Salary = new Salary { Min = 120000, Max = 180000, Currency = "USD" },
                Type = "full-time",
                EmployerId = "emp3",
                CreatedAt = DateTime.UtcNow.AddDays(-5),
                UpdatedAt = DateTime.UtcNow.AddDays(-5)
            },
            new Job
            {
                Id = "4",
                Title = "DevOps Engineer",
                Company = "CloudFirst Solutions",
                Description = "Help us build and maintain scalable infrastructure using modern DevOps practices.",
                Requirements = new List<string> { "AWS", "Docker", "Kubernetes", "CI/CD", "3+ years experience" },
                Location = "Austin, TX",
                Salary = new Salary { Min = 95000, Max = 140000, Currency = "USD" },
                Type = "full-time",
                EmployerId = "emp4",
                CreatedAt = DateTime.UtcNow.AddDays(-12),
                UpdatedAt = DateTime.UtcNow.AddDays(-12)
            }
        };

        foreach (var job in sampleJobs)
        {
            _jobs.TryAdd(job.Id, job);
        }
    }

    // Users
    public Task<User?> GetUserAsync(string id)
    {
        _users.TryGetValue(id, out var user);
        return Task.FromResult(user);
    }

    public Task<User?> GetUserByEmailAsync(string email)
    {
        var user = _users.Values.FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(user);
    }

    public Task<User> CreateUserAsync(User user)
    {
        user.Id = Guid.NewGuid().ToString();
        user.CreatedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;
        _users.TryAdd(user.Id, user);
        return Task.FromResult(user);
    }

    public Task<User> UpdateUserAsync(User user)
    {
        user.UpdatedAt = DateTime.UtcNow;
        _users.AddOrUpdate(user.Id, user, (key, existingUser) => user);
        return Task.FromResult(user);
    }

    public Task<bool> DeleteUserAsync(string id)
    {
        return Task.FromResult(_users.TryRemove(id, out _));
    }

    // Jobs
    public Task<List<Job>> GetJobsAsync(int page = 1, int limit = 10, JobFilters? filters = null)
    {
        var query = _jobs.Values.Where(j => j.IsActive);

        if (filters != null)
        {
            if (!string.IsNullOrEmpty(filters.Search))
            {
                var searchLower = filters.Search.ToLower();
                query = query.Where(j =>
                    j.Title.ToLower().Contains(searchLower) ||
                    j.Company.ToLower().Contains(searchLower) ||
                    j.Description.ToLower().Contains(searchLower));
            }

            if (!string.IsNullOrEmpty(filters.Location))
            {
                query = query.Where(j => j.Location.ToLower().Contains(filters.Location.ToLower()));
            }

            if (!string.IsNullOrEmpty(filters.Type))
            {
                query = query.Where(j => j.Type.Equals(filters.Type, StringComparison.OrdinalIgnoreCase));
            }

            if (filters.MinSalary.HasValue)
            {
                query = query.Where(j => j.Salary.Min >= filters.MinSalary.Value);
            }

            if (filters.MaxSalary.HasValue)
            {
                query = query.Where(j => j.Salary.Max <= filters.MaxSalary.Value);
            }

            if (filters.Skills != null && filters.Skills.Any())
            {
                query = query.Where(j => filters.Skills.Any(skill =>
                    j.Requirements.Any(req => req.ToLower().Contains(skill.ToLower()))));
            }
        }

        var result = query
            .OrderByDescending(j => j.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToList();

        return Task.FromResult(result);
    }

    public Task<Job?> GetJobAsync(string id)
    {
        _jobs.TryGetValue(id, out var job);
        return Task.FromResult(job);
    }

    public Task<Job> CreateJobAsync(Job job)
    {
        job.Id = Guid.NewGuid().ToString();
        job.CreatedAt = DateTime.UtcNow;
        job.UpdatedAt = DateTime.UtcNow;
        _jobs.TryAdd(job.Id, job);
        return Task.FromResult(job);
    }

    public Task<Job> UpdateJobAsync(Job job)
    {
        job.UpdatedAt = DateTime.UtcNow;
        _jobs.AddOrUpdate(job.Id, job, (key, existingJob) => job);
        return Task.FromResult(job);
    }

    public Task<bool> DeleteJobAsync(string id)
    {
        return Task.FromResult(_jobs.TryRemove(id, out _));
    }

    public Task<int> GetJobsCountAsync(JobFilters? filters = null)
    {
        var query = _jobs.Values.Where(j => j.IsActive);

        if (filters != null)
        {
            if (!string.IsNullOrEmpty(filters.Search))
            {
                var searchLower = filters.Search.ToLower();
                query = query.Where(j =>
                    j.Title.ToLower().Contains(searchLower) ||
                    j.Company.ToLower().Contains(searchLower) ||
                    j.Description.ToLower().Contains(searchLower));
            }

            if (!string.IsNullOrEmpty(filters.Location))
            {
                query = query.Where(j => j.Location.ToLower().Contains(filters.Location.ToLower()));
            }

            if (!string.IsNullOrEmpty(filters.Type))
            {
                query = query.Where(j => j.Type.Equals(filters.Type, StringComparison.OrdinalIgnoreCase));
            }

            if (filters.MinSalary.HasValue)
            {
                query = query.Where(j => j.Salary.Min >= filters.MinSalary.Value);
            }

            if (filters.MaxSalary.HasValue)
            {
                query = query.Where(j => j.Salary.Max <= filters.MaxSalary.Value);
            }

            if (filters.Skills != null && filters.Skills.Any())
            {
                query = query.Where(j => filters.Skills.Any(skill =>
                    j.Requirements.Any(req => req.ToLower().Contains(skill.ToLower()))));
            }
        }

        return Task.FromResult(query.Count());
    }

    // Applications
    public Task<List<Application>> GetApplicationsAsync(string? jobId = null, string? candidateId = null)
    {
        var query = _applications.Values.AsQueryable();

        if (!string.IsNullOrEmpty(jobId))
        {
            query = query.Where(a => a.JobId == jobId);
        }

        if (!string.IsNullOrEmpty(candidateId))
        {
            query = query.Where(a => a.CandidateId == candidateId);
        }

        var result = query.OrderByDescending(a => a.CreatedAt).ToList();
        return Task.FromResult(result);
    }

    public Task<Application?> GetApplicationAsync(string id)
    {
        _applications.TryGetValue(id, out var application);
        return Task.FromResult(application);
    }

    public Task<Application> CreateApplicationAsync(Application application)
    {
        application.Id = Guid.NewGuid().ToString();
        application.CreatedAt = DateTime.UtcNow;
        application.UpdatedAt = DateTime.UtcNow;
        _applications.TryAdd(application.Id, application);
        return Task.FromResult(application);
    }

    public Task<Application> UpdateApplicationAsync(Application application)
    {
        application.UpdatedAt = DateTime.UtcNow;
        _applications.AddOrUpdate(application.Id, application, (key, existingApp) => application);
        return Task.FromResult(application);
    }

    public Task<bool> DeleteApplicationAsync(string id)
    {
        return Task.FromResult(_applications.TryRemove(id, out _));
    }

    // Resume Analysis
    public Task<ResumeAnalysis?> GetResumeAnalysisAsync(string id)
    {
        _resumeAnalyses.TryGetValue(id, out var analysis);
        return Task.FromResult(analysis);
    }

    public Task<ResumeAnalysis?> GetResumeAnalysisByUserIdAsync(string userId)
    {
        var analysis = _resumeAnalyses.Values.FirstOrDefault(a => a.UserId == userId);
        return Task.FromResult(analysis);
    }

    public Task<ResumeAnalysis> CreateResumeAnalysisAsync(ResumeAnalysis analysis)
    {
        analysis.Id = Guid.NewGuid().ToString();
        analysis.AnalyzedAt = DateTime.UtcNow;
        _resumeAnalyses.TryAdd(analysis.Id, analysis);
        return Task.FromResult(analysis);
    }

    public Task<ResumeAnalysis> UpdateResumeAnalysisAsync(ResumeAnalysis analysis)
    {
        _resumeAnalyses.AddOrUpdate(analysis.Id, analysis, (key, existing) => analysis);
        return Task.FromResult(analysis);
    }

    public Task<bool> DeleteResumeAnalysisAsync(string id)
    {
        return Task.FromResult(_resumeAnalyses.TryRemove(id, out _));
    }

    // HR Contacts
    public Task<List<HRContact>> GetHRContactsAsync(List<string>? industries = null, List<string>? skills = null)
    {
        var query = _hrContacts.Values.Where(c => c.IsActive);

        if (industries != null && industries.Any())
        {
            query = query.Where(c => industries.Contains(c.Industry, StringComparer.OrdinalIgnoreCase));
        }

        if (skills != null && skills.Any())
        {
            query = query.Where(c => skills.Any(skill =>
                c.RelevantSkills.Any(rs => rs.Contains(skill, StringComparison.OrdinalIgnoreCase))));
        }

        var result = query.OrderBy(c => c.CreatedAt).ToList();
        return Task.FromResult(result);
    }

    public Task<HRContact?> GetHRContactAsync(string id)
    {
        _hrContacts.TryGetValue(id, out var contact);
        return Task.FromResult(contact);
    }

    public Task<HRContact?> GetHRContactByEmailAsync(string email)
    {
        var contact = _hrContacts.Values.FirstOrDefault(c => c.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(contact);
    }

    public Task<List<HRContact>> CreateHRContactsAsync(List<HRContact> contacts)
    {
        var createdContacts = new List<HRContact>();

        foreach (var contact in contacts)
        {
            // Check if contact already exists
            var existing = _hrContacts.Values.FirstOrDefault(c => c.Email.Equals(contact.Email, StringComparison.OrdinalIgnoreCase));
            if (existing == null)
            {
                contact.Id = Guid.NewGuid().ToString();
                contact.CreatedAt = DateTime.UtcNow;
                contact.UpdatedAt = DateTime.UtcNow;
                _hrContacts.TryAdd(contact.Id, contact);
                createdContacts.Add(contact);
            }
        }

        return Task.FromResult(createdContacts);
    }

    public Task<HRContact> UpdateHRContactAsync(HRContact contact)
    {
        contact.UpdatedAt = DateTime.UtcNow;
        _hrContacts.AddOrUpdate(contact.Id, contact, (key, existing) => contact);
        return Task.FromResult(contact);
    }

    public Task<bool> DeleteHRContactAsync(string id)
    {
        return Task.FromResult(_hrContacts.TryRemove(id, out _));
    }

    // Cold Email Campaigns
    public Task<List<ColdEmailCampaign>> GetColdEmailCampaignsAsync(string? userId = null)
    {
        var query = _coldEmailCampaigns.Values.AsQueryable();

        if (!string.IsNullOrEmpty(userId))
        {
            query = query.Where(c => c.UserId == userId);
        }

        var result = query.OrderByDescending(c => c.CreatedAt).ToList();
        return Task.FromResult(result);
    }

    public Task<ColdEmailCampaign?> GetColdEmailCampaignAsync(string id)
    {
        _coldEmailCampaigns.TryGetValue(id, out var campaign);
        return Task.FromResult(campaign);
    }

    public Task<ColdEmailCampaign> CreateColdEmailCampaignAsync(ColdEmailCampaign campaign)
    {
        campaign.Id = Guid.NewGuid().ToString();
        campaign.CreatedAt = DateTime.UtcNow;
        _coldEmailCampaigns.TryAdd(campaign.Id, campaign);
        return Task.FromResult(campaign);
    }

    public Task<ColdEmailCampaign> UpdateColdEmailCampaignAsync(ColdEmailCampaign campaign)
    {
        _coldEmailCampaigns.AddOrUpdate(campaign.Id, campaign, (key, existing) => campaign);
        return Task.FromResult(campaign);
    }

    public Task<bool> DeleteColdEmailCampaignAsync(string id)
    {
        return Task.FromResult(_coldEmailCampaigns.TryRemove(id, out _));
    }

    // Cold Email Outreach
    public Task<List<ColdEmailOutreach>> GetColdEmailOutreachesAsync(string? campaignId = null)
    {
        var query = _coldEmailOutreaches.Values.AsQueryable();

        if (!string.IsNullOrEmpty(campaignId))
        {
            query = query.Where(o => o.CampaignId == campaignId);
        }

        var result = query.OrderByDescending(o => o.SentAt ?? DateTime.MinValue).ToList();
        return Task.FromResult(result);
    }

    public Task<ColdEmailOutreach?> GetColdEmailOutreachAsync(string id)
    {
        _coldEmailOutreaches.TryGetValue(id, out var outreach);
        return Task.FromResult(outreach);
    }

    public Task<ColdEmailOutreach> CreateColdEmailOutreachAsync(ColdEmailOutreach outreach)
    {
        outreach.Id = Guid.NewGuid().ToString();
        _coldEmailOutreaches.TryAdd(outreach.Id, outreach);
        return Task.FromResult(outreach);
    }

    public Task<ColdEmailOutreach> UpdateColdEmailOutreachAsync(ColdEmailOutreach outreach)
    {
        _coldEmailOutreaches.AddOrUpdate(outreach.Id, outreach, (key, existing) => outreach);
        return Task.FromResult(outreach);
    }

    public Task<bool> DeleteColdEmailOutreachAsync(string id)
    {
        return Task.FromResult(_coldEmailOutreaches.TryRemove(id, out _));
    }

    // Email Analysis
    public Task<EmailAnalysis?> GetEmailAnalysisAsync(string id)
    {
        _emailAnalyses.TryGetValue(id, out var analysis);
        return Task.FromResult(analysis);
    }

    public Task<EmailAnalysis?> GetEmailAnalysisByOutreachIdAsync(string outreachId)
    {
        var analysis = _emailAnalyses.Values.FirstOrDefault(a => a.OutreachId == outreachId);
        return Task.FromResult(analysis);
    }

    public Task<EmailAnalysis> CreateEmailAnalysisAsync(EmailAnalysis analysis)
    {
        analysis.Id = Guid.NewGuid().ToString();
        analysis.AnalyzedAt = DateTime.UtcNow;
        _emailAnalyses.TryAdd(analysis.Id, analysis);
        return Task.FromResult(analysis);
    }

    public Task<EmailAnalysis> UpdateEmailAnalysisAsync(EmailAnalysis analysis)
    {
        _emailAnalyses.AddOrUpdate(analysis.Id, analysis, (key, existing) => analysis);
        return Task.FromResult(analysis);
    }

    public Task<bool> DeleteEmailAnalysisAsync(string id)
    {
        return Task.FromResult(_emailAnalyses.TryRemove(id, out _));
    }

    // Mailbox - Get all emails for user (sent and received)
    public Task<List<ColdEmailOutreach>> GetUserEmailsAsync(string userId)
    {
        // Get all campaigns for this user
        var userCampaigns = _coldEmailCampaigns.Values.Where(c => c.UserId == userId).Select(c => c.Id).ToHashSet();

        // Get all outreach emails from user's campaigns
        var userEmails = _coldEmailOutreaches.Values
            .Where(o => userCampaigns.Contains(o.CampaignId))
            .OrderByDescending(o => o.SentAt ?? DateTime.MinValue)
            .ToList();

        return Task.FromResult(userEmails);
    }

    // Email Sent Methods
    public Task<List<EmailSent>> GetEmailsSentAsync(string? userId = null, string? campaignId = null)
    {
        var emails = _emailsSent.Values.AsEnumerable();

        if (!string.IsNullOrEmpty(userId))
            emails = emails.Where(e => e.UserId == userId);

        if (!string.IsNullOrEmpty(campaignId))
            emails = emails.Where(e => e.CampaignId == campaignId);

        return Task.FromResult(emails.OrderByDescending(e => e.DateSent).ToList());
    }

    public Task<EmailSent?> GetEmailSentAsync(string id)
    {
        _emailsSent.TryGetValue(id, out var email);
        return Task.FromResult(email);
    }

    public Task<EmailSent> CreateEmailSentAsync(EmailSent emailSent)
    {
        emailSent.Id = Guid.NewGuid().ToString();
        emailSent.CreatedAt = DateTime.UtcNow;
        emailSent.UpdatedAt = DateTime.UtcNow;
        _emailsSent.TryAdd(emailSent.Id, emailSent);
        return Task.FromResult(emailSent);
    }

    public Task<EmailSent> UpdateEmailSentAsync(EmailSent emailSent)
    {
        emailSent.UpdatedAt = DateTime.UtcNow;
        _emailsSent.AddOrUpdate(emailSent.Id, emailSent, (key, existing) => emailSent);
        return Task.FromResult(emailSent);
    }

    public Task<bool> DeleteEmailSentAsync(string id)
    {
        return Task.FromResult(_emailsSent.TryRemove(id, out _));
    }

    // Email Received Methods
    public Task<List<EmailReceived>> GetEmailsReceivedAsync(string? userId = null, string? originalEmailId = null)
    {
        var emails = _emailsReceived.Values.AsEnumerable();

        if (!string.IsNullOrEmpty(userId))
            emails = emails.Where(e => e.UserId == userId);

        if (!string.IsNullOrEmpty(originalEmailId))
            emails = emails.Where(e => e.OriginalEmailId == originalEmailId);

        return Task.FromResult(emails.OrderByDescending(e => e.DateReceived).ToList());
    }

    public Task<EmailReceived?> GetEmailReceivedAsync(string id)
    {
        _emailsReceived.TryGetValue(id, out var email);
        return Task.FromResult(email);
    }

    public Task<EmailReceived> CreateEmailReceivedAsync(EmailReceived emailReceived)
    {
        emailReceived.Id = Guid.NewGuid().ToString();
        emailReceived.CreatedAt = DateTime.UtcNow;
        emailReceived.UpdatedAt = DateTime.UtcNow;
        _emailsReceived.TryAdd(emailReceived.Id, emailReceived);
        return Task.FromResult(emailReceived);
    }

    public Task<EmailReceived> UpdateEmailReceivedAsync(EmailReceived emailReceived)
    {
        emailReceived.UpdatedAt = DateTime.UtcNow;
        _emailsReceived.AddOrUpdate(emailReceived.Id, emailReceived, (key, existing) => emailReceived);
        return Task.FromResult(emailReceived);
    }

    public Task<bool> DeleteEmailReceivedAsync(string id)
    {
        return Task.FromResult(_emailsReceived.TryRemove(id, out _));
    }
}
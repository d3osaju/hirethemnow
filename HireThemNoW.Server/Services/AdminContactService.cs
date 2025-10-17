using Microsoft.EntityFrameworkCore;
using HireThemNoW.Server.Data;
using HireThemNoW.Server.Models;

namespace HireThemNoW.Server.Services
{
    public class AdminContactService : IAdminContactService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AdminContactService> _logger;

        public AdminContactService(ApplicationDbContext context, ILogger<AdminContactService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<PagedResult<JobOpportunity>> GetContactsAsync(int page, int pageSize, string? search = null, string? sortBy = null, string? sortDirection = "desc")
        {
            try
            {
                // Validate pagination parameters
                page = Math.Max(1, page);
                pageSize = Math.Clamp(pageSize, 1, 100);

                var query = _context.JobOpportunities.AsQueryable();

                // Apply search filter
                if (!string.IsNullOrWhiteSpace(search))
                {
                    var searchTerm = search.Trim().ToLower();
                    query = query.Where(j => 
                        j.Company.ToLower().Contains(searchTerm) || 
                        j.JobTitle.ToLower().Contains(searchTerm));
                }

                // Apply sorting
                var isDescending = sortDirection?.ToLower() == "desc";
                query = sortBy?.ToLower() switch
                {
                    "company" => isDescending 
                        ? query.OrderByDescending(j => j.Company)
                        : query.OrderBy(j => j.Company),
                    "jobtitle" => isDescending 
                        ? query.OrderByDescending(j => j.JobTitle)
                        : query.OrderBy(j => j.JobTitle),
                    "date" => isDescending 
                        ? query.OrderByDescending(j => j.CreatedAt)
                        : query.OrderBy(j => j.CreatedAt),
                    _ => query.OrderByDescending(j => j.CreatedAt) // Default sort by date descending
                };

                // Get total count for pagination
                var totalCount = await query.CountAsync();

                // Apply pagination
                var items = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                _logger.LogInformation("Retrieved {Count} contacts (page {Page}, size {PageSize}, total {Total})", 
                    items.Count, page, pageSize, totalCount);

                return new PagedResult<JobOpportunity>
                {
                    Items = items,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving contacts with search '{Search}', sort '{SortBy}', page {Page}", 
                    search, sortBy, page);
                throw;
            }
        }

        public async Task<JobOpportunity?> GetContactAsync(int id)
        {
            try
            {
                var contact = await _context.JobOpportunities
                    .FirstOrDefaultAsync(j => j.Id == id);

                if (contact != null)
                {
                    _logger.LogInformation("Retrieved contact {Id}: {Company} - {JobTitle}", 
                        id, contact.Company, contact.JobTitle);
                }
                else
                {
                    _logger.LogWarning("Contact with ID {Id} not found", id);
                }

                return contact;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving contact with ID {Id}", id);
                throw;
            }
        }

        public async Task<JobOpportunity> UpdateContactAsync(int id, UpdateContactRequest request)
        {
            try
            {
                var contact = await _context.JobOpportunities
                    .FirstOrDefaultAsync(j => j.Id == id);

                if (contact == null)
                {
                    throw new ArgumentException($"Contact with ID {id} not found");
                }

                // Update contact properties
                contact.JobTitle = request.JobTitle.Trim();
                contact.Company = request.Company.Trim();
                contact.Location = request.Location?.Trim() ?? string.Empty;
                contact.Emails = request.Emails?.Trim() ?? string.Empty;
                contact.EmailType = request.EmailType?.Trim() ?? "summary";
                contact.IsRemote = request.IsRemote;
                contact.Salary = request.Salary?.Trim() ?? string.Empty;
                contact.Link = request.Link?.Trim() ?? string.Empty;
                contact.Snippet = request.Snippet?.Trim() ?? string.Empty;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Updated contact {Id}: {Company} - {JobTitle}", 
                    id, contact.Company, contact.JobTitle);

                return contact;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating contact with ID {Id}", id);
                throw;
            }
        }

        public async Task<bool> DeleteContactAsync(int id)
        {
            try
            {
                var contact = await _context.JobOpportunities
                    .FirstOrDefaultAsync(j => j.Id == id);

                if (contact == null)
                {
                    _logger.LogWarning("Contact with ID {Id} not found for deletion", id);
                    return false;
                }

                _context.JobOpportunities.Remove(contact);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Deleted contact {Id}: {Company} - {JobTitle}", 
                    id, contact.Company, contact.JobTitle);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting contact with ID {Id}", id);
                throw;
            }
        }
    }
}
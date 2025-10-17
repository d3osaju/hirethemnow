using HireThemNoW.Server.Models;

namespace HireThemNoW.Server.Services
{
    public interface IAdminContactService
    {
        /// <summary>
        /// Gets a paginated list of job opportunities with optional search and sorting
        /// </summary>
        /// <param name="page">Page number (1-based)</param>
        /// <param name="pageSize">Number of items per page</param>
        /// <param name="search">Optional search term for company name or job title</param>
        /// <param name="sortBy">Optional sort field (date, company, jobtitle)</param>
        /// <param name="sortDirection">Sort direction (asc or desc)</param>
        /// <returns>Paginated result of job opportunities</returns>
        Task<PagedResult<JobOpportunity>> GetContactsAsync(int page, int pageSize, string? search = null, string? sortBy = null, string? sortDirection = "desc");

        /// <summary>
        /// Gets a specific job opportunity by ID
        /// </summary>
        /// <param name="id">Job opportunity ID</param>
        /// <returns>Job opportunity or null if not found</returns>
        Task<JobOpportunity?> GetContactAsync(int id);

        /// <summary>
        /// Updates a job opportunity with new information
        /// </summary>
        /// <param name="id">Job opportunity ID</param>
        /// <param name="request">Update request with new data</param>
        /// <returns>Updated job opportunity</returns>
        Task<JobOpportunity> UpdateContactAsync(int id, UpdateContactRequest request);

        /// <summary>
        /// Deletes a job opportunity
        /// </summary>
        /// <param name="id">Job opportunity ID</param>
        /// <returns>True if deleted successfully, false if not found</returns>
        Task<bool> DeleteContactAsync(int id);
    }
}
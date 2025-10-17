using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HireThemNoW.Server.Models;
using HireThemNoW.Server.Services;
using System.ComponentModel.DataAnnotations;

namespace HireThemNoW.Server.Controllers
{
    [ApiController]
    [Route("api/admin/[controller]")]
    [Authorize(Roles = "admin")]
    public class ContactController : ControllerBase
    {
        private readonly IAdminContactService _adminContactService;
        private readonly ILogger<ContactController> _logger;

        public ContactController(IAdminContactService adminContactService, ILogger<ContactController> logger)
        {
            _adminContactService = adminContactService;
            _logger = logger;
        }

        /// <summary>
        /// Gets a paginated list of all HR contacts with optional search and sorting
        /// </summary>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="pageSize">Items per page (default: 20, max: 100)</param>
        /// <param name="search">Search term for company name or job title</param>
        /// <param name="sortBy">Sort field: date, company, jobtitle (default: date)</param>
        /// <param name="sortDirection">Sort direction: asc, desc (default: desc)</param>
        /// <returns>Paginated list of contacts</returns>
        [HttpGet]
        public async Task<ActionResult<object>> GetContacts(
            [Range(1, int.MaxValue)] int page = 1,
            [Range(1, 100)] int pageSize = 20,
            string? search = null,
            string? sortBy = null,
            string? sortDirection = "desc")
        {
            try
            {
                _logger.LogInformation("Admin user {UserId} requesting contacts - Page: {Page}, Size: {PageSize}, Search: '{Search}', Sort: {SortBy} {SortDirection}",
                    User.Identity?.Name, page, pageSize, search, sortBy, sortDirection);

                var result = await _adminContactService.GetContactsAsync(page, pageSize, search, sortBy, sortDirection);
                
                return Ok(new
                {
                    success = true,
                    message = $"Retrieved {result.Items.Count} contacts from page {page}",
                    data = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving contacts for admin user {UserId}", User.Identity?.Name);
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while retrieving contacts"
                });
            }
        }

        /// <summary>
        /// Gets detailed information for a specific HR contact
        /// </summary>
        /// <param name="id">Contact ID</param>
        /// <returns>Contact details</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetContact(int id)
        {
            try
            {
                _logger.LogInformation("Admin user {UserId} requesting contact details for ID {ContactId}",
                    User.Identity?.Name, id);

                var contact = await _adminContactService.GetContactAsync(id);
                
                if (contact == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = $"Contact with ID {id} not found"
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Contact retrieved successfully",
                    data = contact
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving contact {ContactId} for admin user {UserId}", 
                    id, User.Identity?.Name);
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while retrieving the contact"
                });
            }
        }

        /// <summary>
        /// Updates an existing HR contact
        /// </summary>
        /// <param name="id">Contact ID</param>
        /// <param name="request">Updated contact information</param>
        /// <returns>Updated contact</returns>
        [HttpPut("{id}")]
        public async Task<ActionResult<object>> UpdateContact(int id, [FromBody] UpdateContactRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();
                    
                    return BadRequest(new
                    {
                        success = false,
                        message = "Validation failed",
                        errors = errors
                    });
                }

                _logger.LogInformation("Admin user {UserId} updating contact {ContactId}: {Company} - {JobTitle}",
                    User.Identity?.Name, id, request.Company, request.JobTitle);

                var updatedContact = await _adminContactService.UpdateContactAsync(id, request);
                
                return Ok(new
                {
                    success = true,
                    message = "Contact updated successfully",
                    data = updatedContact
                });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning("Contact {ContactId} not found for update by admin user {UserId}: {Message}",
                    id, User.Identity?.Name, ex.Message);
                return NotFound(new
                {
                    success = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating contact {ContactId} for admin user {UserId}", 
                    id, User.Identity?.Name);
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while updating the contact"
                });
            }
        }

        /// <summary>
        /// Deletes an HR contact
        /// </summary>
        /// <param name="id">Contact ID</param>
        /// <returns>Deletion confirmation</returns>
        [HttpDelete("{id}")]
        public async Task<ActionResult<object>> DeleteContact(int id)
        {
            try
            {
                _logger.LogInformation("Admin user {UserId} requesting deletion of contact {ContactId}",
                    User.Identity?.Name, id);

                var deleted = await _adminContactService.DeleteContactAsync(id);
                
                if (!deleted)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = $"Contact with ID {id} not found"
                    });
                }

                _logger.LogInformation("Admin user {UserId} successfully deleted contact {ContactId}",
                    User.Identity?.Name, id);

                return Ok(new
                {
                    success = true,
                    message = "Contact deleted successfully",
                    data = new { id }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting contact {ContactId} for admin user {UserId}", 
                    id, User.Identity?.Name);
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while deleting the contact"
                });
            }
        }
    }
}
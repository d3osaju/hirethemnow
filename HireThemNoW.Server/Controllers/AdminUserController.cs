using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HireThemNoW.Server.Data;
using HireThemNoW.Server.Models;
using HireThemNoW.Server.Services;
using System.Security.Claims;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "admin")]
public class AdminUserController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IDataService _dataService;
    private readonly ILogger<AdminUserController> _logger;

    public AdminUserController(ApplicationDbContext context, IDataService dataService, ILogger<AdminUserController> logger)
    {
        _context = context;
        _dataService = dataService;
        _logger = logger;
    }

    [HttpGet("test")]
    public ActionResult<object> Test()
    {
        var adminUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var adminEmail = User.FindFirst(ClaimTypes.Email)?.Value;
        var adminRole = User.FindFirst(ClaimTypes.Role)?.Value;
        
        _logger.LogInformation("Admin test endpoint accessed by user {UserId}", adminUserId);
        
        return Ok(new { 
            message = "Admin controller is working", 
            timestamp = DateTime.UtcNow,
            user = new {
                id = adminUserId,
                email = adminEmail,
                role = adminRole
            }
        });
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<AdminUserDto>>>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? role = null,
        [FromQuery] string? trialStatus = null,
        [FromQuery] string? sortBy = "createdAt",
        [FromQuery] string? sortOrder = "desc")
    {
        try
        {
            var adminUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("Admin user {UserId} requesting users - Page: {Page}, Size: {PageSize}, Search: '{Search}', Role: {Role}, TrialStatus: {TrialStatus}, Sort: {SortBy} {SortOrder}",
                adminUserId, page, pageSize, search, role, trialStatus, sortBy, sortOrder);

            var query = _context.Users.AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(u => u.Name.Contains(search) || u.Email.Contains(search));
            }

            if (!string.IsNullOrEmpty(role))
            {
                query = query.Where(u => u.Role == role);
            }

            if (!string.IsNullOrEmpty(trialStatus))
            {
                var now = DateTime.UtcNow;
                query = trialStatus switch
                {
                    "active" => query.Where(u => u.TrialEndDate > now && !u.HasActiveSubscription),
                    "expired" => query.Where(u => u.TrialEndDate <= now && !u.HasActiveSubscription),
                    "subscribed" => query.Where(u => u.HasActiveSubscription),
                    _ => query
                };
            }

            // Apply sorting
            query = sortBy?.ToLower() switch
            {
                "name" => sortOrder?.ToLower() == "asc" ? query.OrderBy(u => u.Name) : query.OrderByDescending(u => u.Name),
                "email" => sortOrder?.ToLower() == "asc" ? query.OrderBy(u => u.Email) : query.OrderByDescending(u => u.Email),
                "role" => sortOrder?.ToLower() == "asc" ? query.OrderBy(u => u.Role) : query.OrderByDescending(u => u.Role),
                "createdat" => sortOrder?.ToLower() == "asc" ? query.OrderBy(u => u.CreatedAt) : query.OrderByDescending(u => u.CreatedAt),
                _ => query.OrderByDescending(u => u.CreatedAt)
            };

            var totalCount = await query.CountAsync();
            var users = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var userDtos = users.Select(u => new AdminUserDto
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                Role = u.Role,
                Picture = u.Picture,
                Phone = u.Phone,
                Location = u.Location,
                Bio = u.Bio,
                Skills = u.Skills,
                Title = u.Title,
                Industry = u.Industry,
                Experience = u.Experience,
                ResumeUrl = u.ResumeUrl,
                IsCompleted = u.IsCompleted,
                TrialStartDate = u.TrialStartDate,
                TrialEndDate = u.TrialEndDate,
                IsTrialActive = u.IsTrialActive,
                HasSeenTrialEndMessage = u.HasSeenTrialEndMessage,
                HasActiveSubscription = u.HasActiveSubscription,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt,
                LastLoginAt = null, // TODO: Implement login tracking
                RegistrationSource = "email", // TODO: Track registration source
                ProfileCompleteness = CalculateProfileCompleteness(u),
                ResumeStatus = string.IsNullOrEmpty(u.ResumeUrl) ? "none" : "uploaded"
            }).ToList();

            var result = new PagedResult<AdminUserDto>
            {
                Items = userDtos,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };

            return Ok(new ApiResponse<PagedResult<AdminUserDto>>
            {
                Success = true,
                Message = "Users retrieved successfully",
                Data = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving users");
            return StatusCode(500, new ApiResponse<PagedResult<AdminUserDto>>
            {
                Success = false,
                Message = "Failed to retrieve users"
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<AdminUserDto>>> GetUser(string id)
    {
        try
        {
            var adminUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("Admin user {UserId} requesting user details for ID {UserId}", adminUserId, id);

            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new ApiResponse<AdminUserDto>
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            var userDto = new AdminUserDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                Picture = user.Picture,
                Phone = user.Phone,
                Location = user.Location,
                Bio = user.Bio,
                Skills = user.Skills,
                Title = user.Title,
                Industry = user.Industry,
                Experience = user.Experience,
                ResumeUrl = user.ResumeUrl,
                IsCompleted = user.IsCompleted,
                TrialStartDate = user.TrialStartDate,
                TrialEndDate = user.TrialEndDate,
                IsTrialActive = user.IsTrialActive,
                HasSeenTrialEndMessage = user.HasSeenTrialEndMessage,
                HasActiveSubscription = user.HasActiveSubscription,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                LastLoginAt = null, // TODO: Implement login tracking
                RegistrationSource = "email", // TODO: Track registration source
                ProfileCompleteness = CalculateProfileCompleteness(user),
                ResumeStatus = string.IsNullOrEmpty(user.ResumeUrl) ? "none" : "uploaded"
            };

            return Ok(new ApiResponse<AdminUserDto>
            {
                Success = true,
                Message = "User retrieved successfully",
                Data = userDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user {UserId}", id);
            return StatusCode(500, new ApiResponse<AdminUserDto>
            {
                Success = false,
                Message = "Failed to retrieve user"
            });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<AdminUserDto>>> UpdateUser(string id, [FromBody] AdminUpdateUserRequest request)
    {
        try
        {
            var adminUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("Admin user {UserId} updating user {UserId}", adminUserId, id);

            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new ApiResponse<AdminUserDto>
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            // Update user properties
            if (!string.IsNullOrEmpty(request.Name)) user.Name = request.Name;
            if (!string.IsNullOrEmpty(request.Email)) user.Email = request.Email;
            if (!string.IsNullOrEmpty(request.Role)) user.Role = request.Role;
            if (!string.IsNullOrEmpty(request.Phone)) user.Phone = request.Phone;
            if (!string.IsNullOrEmpty(request.Location)) user.Location = request.Location;
            if (!string.IsNullOrEmpty(request.Bio)) user.Bio = request.Bio;
            if (!string.IsNullOrEmpty(request.Title)) user.Title = request.Title;
            if (!string.IsNullOrEmpty(request.Industry)) user.Industry = request.Industry;
            if (!string.IsNullOrEmpty(request.Experience)) user.Experience = request.Experience;
            if (request.Skills != null) user.Skills = request.Skills;
            if (request.HasActiveSubscription.HasValue) user.HasActiveSubscription = request.HasActiveSubscription.Value;

            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var userDto = new AdminUserDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                Picture = user.Picture,
                Phone = user.Phone,
                Location = user.Location,
                Bio = user.Bio,
                Skills = user.Skills,
                Title = user.Title,
                Industry = user.Industry,
                Experience = user.Experience,
                ResumeUrl = user.ResumeUrl,
                IsCompleted = user.IsCompleted,
                TrialStartDate = user.TrialStartDate,
                TrialEndDate = user.TrialEndDate,
                IsTrialActive = user.IsTrialActive,
                HasSeenTrialEndMessage = user.HasSeenTrialEndMessage,
                HasActiveSubscription = user.HasActiveSubscription,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                LastLoginAt = null,
                RegistrationSource = "email",
                ProfileCompleteness = CalculateProfileCompleteness(user),
                ResumeStatus = string.IsNullOrEmpty(user.ResumeUrl) ? "none" : "uploaded"
            };

            return Ok(new ApiResponse<AdminUserDto>
            {
                Success = true,
                Message = "User updated successfully",
                Data = userDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user {UserId}", id);
            return StatusCode(500, new ApiResponse<AdminUserDto>
            {
                Success = false,
                Message = "Failed to update user"
            });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteUser(string id)
    {
        try
        {
            var adminUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("Admin user {UserId} deleting user {UserId}", adminUserId, id);

            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            // Don't allow deleting admin users
            if (user.Role == "admin")
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Cannot delete admin users"
                });
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "User deleted successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user {UserId}", id);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "Failed to delete user"
            });
        }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<AdminUserDto>>> CreateUser([FromBody] CreateUserRequest request)
    {
        try
        {
            var adminUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("Admin user {UserId} creating new user with email {Email}", adminUserId, request.Email);

            // Check if user already exists
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (existingUser != null)
            {
                return BadRequest(new ApiResponse<AdminUserDto>
                {
                    Success = false,
                    Message = "User with this email already exists"
                });
            }

            var newUser = new User
            {
                Name = request.Name,
                Email = request.Email,
                Role = request.Role
            };

            var createdUser = await _dataService.CreateUserAsync(newUser);

            var userDto = new AdminUserDto
            {
                Id = createdUser.Id,
                Name = createdUser.Name,
                Email = createdUser.Email,
                Role = createdUser.Role,
                Picture = createdUser.Picture,
                Phone = createdUser.Phone,
                Location = createdUser.Location,
                Bio = createdUser.Bio,
                Skills = createdUser.Skills,
                Title = createdUser.Title,
                Industry = createdUser.Industry,
                Experience = createdUser.Experience,
                ResumeUrl = createdUser.ResumeUrl,
                IsCompleted = createdUser.IsCompleted,
                TrialStartDate = createdUser.TrialStartDate,
                TrialEndDate = createdUser.TrialEndDate,
                IsTrialActive = createdUser.IsTrialActive,
                HasSeenTrialEndMessage = createdUser.HasSeenTrialEndMessage,
                HasActiveSubscription = createdUser.HasActiveSubscription,
                CreatedAt = createdUser.CreatedAt,
                UpdatedAt = createdUser.UpdatedAt,
                LastLoginAt = null,
                RegistrationSource = "email",
                ProfileCompleteness = CalculateProfileCompleteness(createdUser),
                ResumeStatus = "none"
            };

            return Ok(new ApiResponse<AdminUserDto>
            {
                Success = true,
                Message = "User created successfully",
                Data = userDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return StatusCode(500, new ApiResponse<AdminUserDto>
            {
                Success = false,
                Message = "Failed to create user"
            });
        }
    }

    private static int CalculateProfileCompleteness(User user)
    {
        var completedFields = 0;
        var totalFields = 8;

        if (!string.IsNullOrEmpty(user.Name)) completedFields++;
        if (!string.IsNullOrEmpty(user.Email)) completedFields++;
        if (!string.IsNullOrEmpty(user.Phone)) completedFields++;
        if (!string.IsNullOrEmpty(user.Location)) completedFields++;
        if (!string.IsNullOrEmpty(user.Bio)) completedFields++;
        if (!string.IsNullOrEmpty(user.Title)) completedFields++;
        if (!string.IsNullOrEmpty(user.Industry)) completedFields++;
        if (user.Skills?.Any() == true) completedFields++;

        return (int)Math.Round((double)completedFields / totalFields * 100);
    }
}

// DTOs
public class AdminUserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? Picture { get; set; }
    public string? Phone { get; set; }
    public string? Location { get; set; }
    public string? Bio { get; set; }
    public List<string> Skills { get; set; } = new();
    public string? Title { get; set; }
    public string? Industry { get; set; }
    public string? Experience { get; set; }
    public string? ResumeUrl { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime TrialStartDate { get; set; }
    public DateTime TrialEndDate { get; set; }
    public bool IsTrialActive { get; set; }
    public bool HasSeenTrialEndMessage { get; set; }
    public bool HasActiveSubscription { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public string RegistrationSource { get; set; } = string.Empty;
    public int ProfileCompleteness { get; set; }
    public string ResumeStatus { get; set; } = string.Empty;
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class AdminUpdateUserRequest
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Role { get; set; }
    public string? Phone { get; set; }
    public string? Location { get; set; }
    public string? Bio { get; set; }
    public string? Title { get; set; }
    public string? Industry { get; set; }
    public string? Experience { get; set; }
    public List<string>? Skills { get; set; }
    public bool? HasActiveSubscription { get; set; }
}

public class CreateUserRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "candidate";
    public string? Password { get; set; }
}
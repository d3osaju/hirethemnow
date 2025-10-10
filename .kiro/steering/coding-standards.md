# Coding Standards and Best Practices

## Overview

This document outlines the coding standards, conventions, and best practices for the HireThemNow project. Following these guidelines ensures consistency, maintainability, and quality across the codebase.

## General Principles

1. **KISS** (Keep It Simple, Stupid) - Prefer simple solutions
2. **DRY** (Don't Repeat Yourself) - Avoid code duplication
3. **YAGNI** (You Aren't Gonna Need It) - Don't add unnecessary features
4. **SOLID** - Follow SOLID principles for OOP
5. **Clean Code** - Write self-documenting, readable code

---

## C# / .NET Backend Standards

### Naming Conventions

**PascalCase**:
- Classes: `UserController`, `ResumeParsingService`
- Methods: `GetUserAsync`, `UploadResume`
- Properties: `UserId`, `CreatedAt`
- Interfaces: `IDataService`, `IS3Service`

**camelCase**:
- Local variables: `userId`, `resumeContent`
- Method parameters: `fileName`, `contentType`
- Private fields: `_logger`, `_dataService`

**UPPER_CASE**:
- Constants: `MAX_FILE_SIZE`, `DEFAULT_TIMEOUT`

### File Organization

```
HireThemNoW.Server/
├── Controllers/        # API endpoints (one controller per resource)
├── Models/            # Data models and DTOs
├── Services/          # Business logic (interfaces + implementations)
├── Data/              # Database context and migrations
├── Migrations/        # EF Core migrations
└── Program.cs         # Application entry point
```

### Controller Standards

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]  // Add if authentication required
public class UsersController : ControllerBase
{
    private readonly IDataService _dataService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IDataService dataService, ILogger<UsersController> logger)
    {
        _dataService = dataService;
        _logger = logger;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<User>>> GetUser(string id)
    {
        try
        {
            var user = await _dataService.GetUserAsync(id);
            
            if (user == null)
            {
                return NotFound(new ApiResponse<User>
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            return Ok(new ApiResponse<User>
            {
                Success = true,
                Message = "User retrieved successfully",
                Data = user
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user {UserId}", id);
            return StatusCode(500, new ApiResponse<User>
            {
                Success = false,
                Message = "An error occurred while retrieving the user",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}
```

### Service Standards

```csharp
// Interface
public interface IDataService
{
    Task<User?> GetUserAsync(string userId);
    Task<User> CreateUserAsync(User user);
    Task<User> UpdateUserAsync(User user);
    Task<bool> DeleteUserAsync(string userId);
}

// Implementation
public class DatabaseDataService : IDataService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DatabaseDataService> _logger;

    public DatabaseDataService(ApplicationDbContext context, ILogger<DatabaseDataService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<User?> GetUserAsync(string userId)
    {
        try
        {
            return await _context.Users.FindAsync(userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user {UserId}", userId);
            throw;
        }
    }
}
```

### Model Standards

```csharp
public class User
{
    // Primary key
    public string Id { get; set; } = string.Empty;
    
    // Required fields
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    
    // Optional fields
    public string? Phone { get; set; }
    public string? Location { get; set; }
    
    // Collections
    public List<string> Skills { get; set; } = new();
    
    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual EmailPreference? EmailPreference { get; set; }
    
    // Methods
    public bool HasAccess()
    {
        var isTrialValid = IsTrialActive && DateTime.UtcNow < TrialEndDate;
        return isTrialValid || HasActiveSubscription;
    }
}
```

### Async/Await Best Practices

```csharp
// ✅ Good - Async all the way
public async Task<User> GetUserAsync(string userId)
{
    return await _context.Users.FindAsync(userId);
}

// ❌ Bad - Blocking async code
public User GetUser(string userId)
{
    return _context.Users.FindAsync(userId).Result;  // Don't do this!
}

// ✅ Good - ConfigureAwait(false) in libraries
public async Task<User> GetUserAsync(string userId)
{
    return await _context.Users.FindAsync(userId).ConfigureAwait(false);
}
```

### Error Handling

```csharp
// ✅ Good - Specific exceptions, logging, user-friendly messages
try
{
    var user = await _dataService.GetUserAsync(userId);
    return Ok(user);
}
catch (NotFoundException ex)
{
    _logger.LogWarning(ex, "User {UserId} not found", userId);
    return NotFound(new { message = "User not found" });
}
catch (Exception ex)
{
    _logger.LogError(ex, "Error retrieving user {UserId}", userId);
    return StatusCode(500, new { message = "An error occurred" });
}

// ❌ Bad - Swallowing exceptions
try
{
    var user = await _dataService.GetUserAsync(userId);
}
catch
{
    // Don't do this!
}
```

### Dependency Injection

```csharp
// ✅ Good - Register in Program.cs
builder.Services.AddScoped<IDataService, DatabaseDataService>();
builder.Services.AddScoped<IS3Service, S3Service>();
builder.Services.AddSingleton<IConfiguration>(builder.Configuration);

// ✅ Good - Constructor injection
public class UsersController : ControllerBase
{
    private readonly IDataService _dataService;
    
    public UsersController(IDataService dataService)
    {
        _dataService = dataService;
    }
}

// ❌ Bad - Service locator pattern
public class UsersController : ControllerBase
{
    public IActionResult GetUser(string id)
    {
        var dataService = HttpContext.RequestServices.GetService<IDataService>();
        // Don't do this!
    }
}
```

### Logging

```csharp
// ✅ Good - Structured logging with context
_logger.LogInformation("User {UserId} logged in successfully", userId);
_logger.LogWarning("Failed login attempt for email {Email}", email);
_logger.LogError(ex, "Error processing resume {ResumeId} for user {UserId}", resumeId, userId);

// ❌ Bad - String interpolation in logs
_logger.LogInformation($"User {userId} logged in");  // Don't do this!

// Log levels
_logger.LogTrace("Detailed trace information");      // Very detailed
_logger.LogDebug("Debug information");               // Development only
_logger.LogInformation("General information");       // Normal flow
_logger.LogWarning("Warning - something unexpected"); // Recoverable
_logger.LogError(ex, "Error occurred");              // Error with exception
_logger.LogCritical(ex, "Critical failure");         // System failure
```

---

## TypeScript / React Frontend Standards

### Naming Conventions

**PascalCase**:
- Components: `UserProfile`, `ResumeUpload`
- Interfaces/Types: `User`, `ApiResponse<T>`

**camelCase**:
- Variables: `userId`, `isLoading`
- Functions: `fetchUser`, `handleSubmit`
- Props: `onSubmit`, `userName`

**UPPER_SNAKE_CASE**:
- Constants: `API_BASE_URL`, `MAX_FILE_SIZE`

### File Organization

```
hirethemnow.client/src/
├── components/        # Reusable components
├── pages/            # Page components
├── utils/            # Utility functions
├── types/            # TypeScript types
├── hooks/            # Custom React hooks
├── services/         # API services
└── App.tsx           # Main app component
```

### Component Standards

```typescript
// ✅ Good - Functional component with TypeScript
import React, { useState, useEffect } from 'react';

interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      setUser(data.data);
    } catch (err) {
      setError('Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
};
```

### Custom Hooks

```typescript
// ✅ Good - Custom hook for API calls
export const useUser = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();
        setUser(data.data);
      } catch (err) {
        setError('Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { user, loading, error };
};

// Usage
const { user, loading, error } = useUser(userId);
```

### API Service Layer

```typescript
// ✅ Good - Centralized API service
export class ApiService {
  private static baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5219';

  static async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  static async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private static getToken(): string {
    return localStorage.getItem('token') || '';
  }
}

// Usage
const user = await ApiService.get<User>('/api/users/profile');
```

### TypeScript Types

```typescript
// ✅ Good - Define types for all data structures
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'candidate' | 'employer';
  picture?: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

// ✅ Good - Use generics for reusable types
export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};
```

---

## Database Standards

### Entity Framework Conventions

```csharp
// ✅ Good - Explicit configuration
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<User>(entity =>
    {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Email).IsRequired();
        entity.HasIndex(e => e.Email).IsUnique();
    });
}

// ✅ Good - Use migrations for schema changes
dotnet ef migrations add AddUserPhoneNumber
dotnet ef database update
```

### Query Best Practices

```csharp
// ✅ Good - Use async, Include for eager loading
var user = await _context.Users
    .Include(u => u.EmailPreference)
    .FirstOrDefaultAsync(u => u.Id == userId);

// ❌ Bad - N+1 query problem
var users = await _context.Users.ToListAsync();
foreach (var user in users)
{
    var prefs = await _context.EmailPreferences
        .FirstOrDefaultAsync(e => e.UserId == user.Id);  // Don't do this!
}

// ✅ Good - Projection for performance
var userDtos = await _context.Users
    .Select(u => new UserDto
    {
        Id = u.Id,
        Name = u.Name,
        Email = u.Email
    })
    .ToListAsync();
```

---

## Testing Standards

### Unit Test Structure

```csharp
[TestClass]
public class UserServiceTests
{
    private Mock<ApplicationDbContext> _mockContext;
    private UserService _userService;

    [TestInitialize]
    public void Setup()
    {
        _mockContext = new Mock<ApplicationDbContext>();
        _userService = new UserService(_mockContext.Object);
    }

    [TestMethod]
    public async Task GetUserAsync_ValidId_ReturnsUser()
    {
        // Arrange
        var userId = "test-user-id";
        var expectedUser = new User { Id = userId, Name = "Test User" };
        _mockContext.Setup(c => c.Users.FindAsync(userId))
            .ReturnsAsync(expectedUser);

        // Act
        var result = await _userService.GetUserAsync(userId);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(expectedUser.Id, result.Id);
        Assert.AreEqual(expectedUser.Name, result.Name);
    }

    [TestMethod]
    public async Task GetUserAsync_InvalidId_ReturnsNull()
    {
        // Arrange
        var userId = "invalid-id";
        _mockContext.Setup(c => c.Users.FindAsync(userId))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _userService.GetUserAsync(userId);

        // Assert
        Assert.IsNull(result);
    }
}
```

---

## Git Commit Standards

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(auth): add Google OAuth authentication

Implemented Google OAuth login flow with JWT token generation.
Users can now sign in using their Google account.

Closes #123

---

fix(resume): handle corrupted PDF files gracefully

Added error handling for corrupted or encrypted PDF files.
Users now see a clear error message instead of a generic failure.

Fixes #456

---

docs(api): update API endpoint documentation

Added missing endpoints and updated response examples.
```

---

## Security Best Practices

### Input Validation

```csharp
// ✅ Good - Validate all inputs
[HttpPost]
public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
{
    if (string.IsNullOrWhiteSpace(request.Email))
    {
        return BadRequest("Email is required");
    }

    if (!IsValidEmail(request.Email))
    {
        return BadRequest("Invalid email format");
    }

    // Process request...
}
```

### SQL Injection Prevention

```csharp
// ✅ Good - Use parameterized queries (EF Core does this automatically)
var user = await _context.Users
    .FirstOrDefaultAsync(u => u.Email == email);

// ❌ Bad - Raw SQL with string concatenation
var query = $"SELECT * FROM Users WHERE Email = '{email}'";  // Don't do this!
```

### XSS Prevention

```typescript
// ✅ Good - React escapes by default
<div>{user.name}</div>

// ❌ Bad - dangerouslySetInnerHTML without sanitization
<div dangerouslySetInnerHTML={{ __html: userInput }} />  // Don't do this!
```

### Authentication

```csharp
// ✅ Good - Use [Authorize] attribute
[Authorize]
[HttpGet("profile")]
public async Task<IActionResult> GetProfile()
{
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    // Process request...
}
```

---

## Performance Best Practices

### Database

- Use indexes on frequently queried columns
- Use `.AsNoTracking()` for read-only queries
- Avoid N+1 queries with `.Include()`
- Use pagination for large result sets
- Cache frequently accessed data

### API

- Use async/await for I/O operations
- Implement response compression
- Use CDN for static assets
- Minimize payload size
- Implement caching headers

### Frontend

- Lazy load components
- Optimize images
- Use React.memo for expensive components
- Debounce user input
- Minimize bundle size

---

## Code Review Checklist

- [ ] Code follows naming conventions
- [ ] All methods have XML documentation
- [ ] Error handling is implemented
- [ ] Logging is added for important operations
- [ ] Unit tests are written
- [ ] No hardcoded values (use configuration)
- [ ] Security best practices followed
- [ ] Performance considerations addressed
- [ ] Code is DRY (no duplication)
- [ ] Git commit message follows standards

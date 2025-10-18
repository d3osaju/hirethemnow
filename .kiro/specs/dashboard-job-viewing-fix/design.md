# Design Document

## Overview

This design addresses two critical issues in the admin dashboard:
1. **Job Viewing Bug**: The `GetJob` endpoint in `AdminJobController` is not implemented, preventing admins from viewing individual job details
2. **Missing Recruiter Email Display**: Job opportunities contain recruiter email data in the `Emails` field, but this information is not being displayed in the job details
3. **HR Contact Tab Removal**: Remove the unnecessary HR Contact Management functionality from both frontend and backend

The solution involves implementing the missing job viewing functionality, properly displaying recruiter emails, and cleaning up unused HR contact features.

## Architecture

### Backend Changes

#### 1. AdminJobController Enhancement
- **Current State**: `GetJob(int id)` method returns `NotFound()` with TODO comment
- **Target State**: Fully implemented method that retrieves job details from database and returns structured response

#### 2. Email Display Enhancement  
- **Current State**: `Emails` field exists in `JobOpportunity` model but not included in response DTOs
- **Target State**: Email information properly parsed and included in job detail responses

#### 3. HR Contact Removal
- **Files to Remove**:
  - `AdminContactController.cs`
  - `IAdminContactService.cs` 
  - `AdminContactService.cs`
  - `AdminContactDtos.cs` (UpdateContactRequest will be moved to job-related DTOs if needed)
- **Dependencies to Clean**: Remove service registrations and any references

### Frontend Changes

#### 1. HR Contact Tab Removal
- **Current State**: "Contact Management" tab exists in admin dashboard navigation
- **Target State**: Tab removed from navigation, related pages and components deleted

#### 2. Job Detail Display Enhancement
- **Current State**: Job details may not show recruiter email information
- **Target State**: Job detail views properly display recruiter contact information

## Components and Interfaces

### Backend Components

#### Enhanced AdminJobController.GetJob Method
```csharp
[HttpGet("{id}")]
public async Task<ActionResult<ApiResponse<AdminJobOpportunityWithApplicationsDto>>> GetJob(int id)
```

**Responsibilities**:
- Validate job ID parameter
- Query database for job opportunity by ID
- Handle job not found scenarios
- Map JobOpportunity entity to response DTO including email information
- Return structured API response
- Log admin access for audit purposes

#### Enhanced AdminJobOpportunityWithApplicationsDto
**New Fields**:
- `RecruiterEmails`: List of parsed email addresses from the `Emails` field
- `OriginalJobLink`: Direct link to original job posting
- `EmailType`: Type of email contact (from `EmailType` field)

### Frontend Components

#### Files to Remove
- `AdminContacts.tsx`
- `ContactList.tsx` 
- `ContactDetailModal.tsx`
- `ContactEditForm.tsx`
- Related contact management components

#### Navigation Updates
- Remove "Contact Management" tab from `AdminDashboard.tsx`
- Update routing to remove contact-related routes

## Data Models

### JobOpportunity Entity (Existing)
```csharp
public class JobOpportunity
{
    public int Id { get; set; }
    public string JobTitle { get; set; }
    public string Company { get; set; }
    public string Location { get; set; }
    public string Emails { get; set; }        // Contains recruiter emails
    public string EmailType { get; set; }     // Type of email contact
    public bool IsRemote { get; set; }
    public string Salary { get; set; }
    public string Link { get; set; }          // Original job posting link
    public string Snippet { get; set; }       // Job description
    public DateTime? ScrapedDate { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

### Enhanced Response DTO
```csharp
public class AdminJobOpportunityWithApplicationsDto : AdminJobOpportunityDto
{
    public List<string> RecruiterEmails { get; set; } = new();
    public string EmailType { get; set; } = string.Empty;
    public string OriginalJobLink { get; set; } = string.Empty;
    public List<JobApplicationDto> Applications { get; set; } = new();
}
```

## Error Handling

### Job Not Found Scenarios
- **Input**: Invalid or non-existent job ID
- **Response**: HTTP 404 with structured error message
- **Logging**: Log attempted access with admin user ID and requested job ID

### Database Connection Issues
- **Response**: HTTP 500 with generic error message
- **Logging**: Log full exception details for debugging
- **User Experience**: Consistent error format matching other admin endpoints

### Email Parsing Errors
- **Scenario**: Malformed email data in `Emails` field
- **Handling**: Return empty email list rather than failing entire request
- **Logging**: Log parsing issues for data quality monitoring

## Testing Strategy

### Backend Testing
1. **Unit Tests for GetJob Method**:
   - Valid job ID returns correct data
   - Invalid job ID returns 404
   - Database errors return 500
   - Email parsing handles various formats

2. **Integration Tests**:
   - End-to-end job retrieval workflow
   - Authentication and authorization validation
   - Response format consistency

### Frontend Testing  
1. **Component Tests**:
   - Job detail display with email information
   - Navigation without contact management tab
   - Error handling for failed job requests

2. **E2E Tests**:
   - Admin can view job details from dashboard
   - Recruiter emails display correctly
   - No broken links after contact removal

## Implementation Approach

### Phase 1: Backend Implementation
1. Implement `AdminJobController.GetJob` method
2. Enhance response DTOs to include email information
3. Add email parsing logic for various formats
4. Remove HR contact controller and services

### Phase 2: Frontend Updates
1. Remove HR contact tab from navigation
2. Delete contact management components
3. Update job detail displays to show recruiter emails
4. Clean up routing and API calls

### Phase 3: Testing and Validation
1. Test job viewing functionality
2. Verify email display in various formats
3. Confirm no broken references after contact removal
4. Validate admin dashboard navigation

## Security Considerations

### Authentication and Authorization
- Maintain existing admin role requirement for job viewing
- Ensure email information is only accessible to authorized admins
- Log all admin access to job details for audit purposes

### Data Privacy
- Recruiter emails should only be displayed to authenticated admins
- No changes to existing data storage or encryption
- Maintain existing API security patterns

## Performance Considerations

### Database Queries
- Single query to retrieve job by ID (no N+1 issues)
- Leverage existing database indexes on job ID
- Consider caching for frequently accessed jobs

### Email Parsing
- Lightweight string parsing operations
- Handle malformed data gracefully without performance impact
- Consider memoization if email parsing becomes a bottleneck
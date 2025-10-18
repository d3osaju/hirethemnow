# Implementation Plan

- [x] 1. Implement job viewing functionality in AdminJobController





  - Replace the TODO implementation in GetJob method with actual database query
  - Add proper error handling for job not found and database errors
  - Include logging for admin access audit trail
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_


- [x] 2. Enhance job response DTOs to include recruiter email information




  - Add RecruiterEmails, EmailType, and OriginalJobLink properties to AdminJobOpportunityWithApplicationsDto
  - Create email parsing logic to extract emails from the Emails field
  - Handle various email formats and malformed data gracefully
  - _Requirements: 2.1, 2.2, 2.3, 2.5_


- [x] 3. Update job detail mapping to include all available fields




  - Map JobOpportunity entity fields to response DTO including new email fields
  - Ensure original job link and scraped date are properly included
  - Format email addresses for display (mailto links will be handled in frontend)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
- [x] 4. Remove HR Contact backend functionality




- [ ] 4. Remove HR Contact backend functionality

  - Delete AdminContactController.cs file
  - Delete IAdminContactService.cs and AdminContactService.cs files
  - Remove service registrations from Program.cs or dependency injection configuration
  - Clean up any references to contact services
  - _Requirements: 5.2, 5.4_

- [x] 5. Remove HR Contact frontend components and navigation





  - Remove "Contact Management" tab from AdminDashboard.tsx navigation
  - Delete AdminContacts.tsx page component
  - Delete contact-related components (ContactList, ContactDetailModal, ContactEditForm)
  - Remove contact-related routes from routing configuration
  - _Requirements: 5.1, 5.3, 5.4_

- [x] 6. Clean up contact-related API calls and types





  - Remove adminContactAPI functions from services/api.ts
  - Remove contact-related types from types/index.ts (keep JobOpportunity, remove UpdateContactRequest if only used for contacts)
  - Update imports in remaining files to remove contact-related dependencies
  - _Requirements: 5.2, 5.4_

- [ ]* 7. Add unit tests for job viewing functionality
  - Write tests for AdminJobController.GetJob method covering success and error cases
  - Test email parsing logic with various input formats
  - Verify proper error handling and response formatting
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_

- [ ]* 8. Add integration tests for complete job viewing workflow
  - Test end-to-end job retrieval from database to API response
  - Verify authentication and authorization requirements
  - Test response format consistency with other admin endpoints
  - _Requirements: 4.1, 4.2, 4.3, 4.4_
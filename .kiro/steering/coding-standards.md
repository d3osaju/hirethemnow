# Coding Standards and Best Practices

## Backend (C# / ASP.NET Core)

### Architecture Principles

- **Service Layer Pattern**: All business logic must be in service classes with interface definitions
- **Dependency Injection**: Use constructor injection for all dependencies
- **Async/Await**: All I/O operations (database, S3, external APIs) must be async
- **Interface Segregation**: Keep interfaces focused and single-purpose

### Naming Conventions

- **Interfaces**: Prefix with `I` (e.g., `IDataService`, `IS3Service`)
- **Services**: Suffix with `Service` (e.g., `EmailService`, `ResumeParsingService`)
- **DTOs**: Use descriptive names ending in `Request`, `Response`, or `Result` (e.g., `ParsedResumeResult`)
- **Controllers**: Suffix with `Controller` and use plural nouns for resource endpoints

### Error Handling

- Use try-catch blocks for external service calls (AWS, database)
- Log errors with appropriate context using ILogger
- Return appropriate HTTP status codes (400 for validation, 404 for not found, 500 for server errors)
- Use ApiResponse wrapper for consistent API responses

### Database

- Use Entity Framework Core migrations for all schema changes
- Never use raw SQL unless absolutely necessary
- Always use async methods (ToListAsync, FirstOrDefaultAsync, etc.)
- Use proper indexes for frequently queried fields

### AWS Services

- Always use IAM roles and policies, never hardcode credentials
- Handle AWS service exceptions gracefully
- Use appropriate retry logic for transient failures
- Log AWS operation results for debugging

## Frontend (React / TypeScript)

### Component Structure

- **Functional Components**: Use function components with hooks, not class components
- **Custom Hooks**: Extract reusable logic into custom hooks (prefix with `use`)
- **Component Files**: One component per file, named with PascalCase
- **Props**: Define explicit TypeScript interfaces for all component props

### State Management

- Use React Context for global state (auth, user data)
- Use local state (useState) for component-specific state
- Use useEffect for side effects and data fetching
- Avoid prop drilling - use context when passing data through multiple levels

### TypeScript

- **Strict Mode**: Always use strict TypeScript settings
- **Type Definitions**: Define explicit types for all props, state, and function parameters
- **Avoid `any`**: Never use `any` type unless absolutely necessary
- **Interfaces**: Use interfaces for object shapes, types for unions/primitives

### API Integration

- Centralize API calls in service files (e.g., `services/api.ts`)
- Use Axios interceptors for auth token injection
- Handle loading and error states consistently
- Use React Hot Toast for user notifications

### Styling

- **Tailwind CSS**: Use utility classes for styling
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Consistency**: Use consistent spacing, colors, and typography
- **Accessibility**: Include proper ARIA labels and semantic HTML

### Code Quality

- **ESLint**: Fix all linting errors before committing
- **Prettier**: Format code consistently
- **Type Checking**: Run `npm run type-check` before committing
- **Git Hooks**: Husky runs linting and type checking on pre-commit

## Testing

### Backend Testing

- Write integration tests for API endpoints
- Test happy paths and error scenarios
- Use in-memory database for testing when possible
- Mock external services (AWS, email)

### Frontend Testing

- Test user interactions and component behavior
- Test API integration with mocked responses
- Test error handling and loading states

## Git Workflow

- **Commit Messages**: Use clear, descriptive commit messages
- **Branch Names**: Use descriptive branch names (feature/, bugfix/, hotfix/)
- **Pull Requests**: Include description of changes and testing performed
- **Code Review**: Review code for logic, security, and best practices

## Security

- **Authentication**: Always validate JWT tokens on backend
- **Authorization**: Check user permissions before allowing operations
- **Input Validation**: Validate all user input on both frontend and backend
- **Secrets**: Never commit secrets, use environment variables
- **CORS**: Configure CORS properly for production
- **SQL Injection**: Use parameterized queries (EF Core handles this)
- **XSS**: React escapes output by default, but be careful with dangerouslySetInnerHTML

## Performance

- **Database**: Use appropriate indexes and avoid N+1 queries
- **Caching**: Cache frequently accessed data when appropriate
- **Lazy Loading**: Load data only when needed
- **Background Jobs**: Use background services for long-running operations
- **File Size**: Enforce file size limits for uploads
- **Pagination**: Paginate large result sets

## Documentation

- **Code Comments**: Comment complex logic and business rules
- **API Documentation**: Swagger/OpenAPI for all endpoints
- **README**: Keep README up to date with setup instructions
- **Steering Files**: Update steering files when architecture changes

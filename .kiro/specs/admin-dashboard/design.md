# Admin Dashboard Design Document

## Overview

The Admin Dashboard feature extends the existing HireThemNow admin functionality to provide comprehensive user management and job opportunity management capabilities. The design leverages the existing React/TypeScript frontend architecture with Tailwind CSS styling and the current admin authentication system.

## Architecture

### Frontend Architecture
- **Framework**: React 19.1.1 with TypeScript
- **Routing**: React Router DOM v7.9.2 with protected admin routes
- **Styling**: Tailwind CSS with existing design system
- **State Management**: React Context (AuthContext) + local component state
- **HTTP Client**: Axios with interceptors for authentication
- **UI Components**: Lucide React icons + custom components

### Backend Integration
- **Authentication**: JWT-based admin authentication (existing)
- **API Pattern**: RESTful endpoints following existing `/admin/*` pattern
- **Authorization**: Role-based access control (admin role required)
- **Data Format**: JSON API responses with consistent error handling

## Components and Interfaces

### 1. Enhanced Admin Dashboard Layout
**File**: `src/pages/admin/AdminDashboard.tsx` (extend existing)

**New Navigation Items**:
- Dashboard Overview (new default route)
- User Management 
- Job Management
- Contact Management (existing)
- Settings (existing)

**Features**:
- Responsive sidebar navigation
- Mobile-friendly hamburger menu
- Admin user profile display
- Logout functionality
- Active route highlighting

### 2. Dashboard Overview Component
**File**: `src/pages/admin/AdminOverview.tsx` (new)

**Metrics Cards**:
- Total Users (with growth indicator)
- Active Jobs (with status breakdown)
- Recent Registrations (last 30 days)
- Job Applications (total and recent)

**Charts and Visualizations**:
- User registration trends (line chart)
- Job posting activity (bar chart)
- User role distribution (pie chart)
- Recent activity feed

### 3. User Management Component
**File**: `src/pages/admin/AdminUsers.tsx` (new)

**Features**:
- Paginated user table with search and filtering
- User detail modal/drawer
- Bulk actions (export, status updates)
- User creation form
- User profile editing
- Account status management (active/inactive)

**Table Columns**:
- Profile picture
- Name and email
- Role (candidate/admin)
- Registration date
- Trial status
- Last activity
- Actions (view, edit, delete)

### 4. Job Management Component
**File**: `src/pages/admin/AdminJobs.tsx` (new)

**Features**:
- Job opportunity listing with search/filter
- Job detail view with application statistics
- Job creation and editing forms
- Job status management (active/inactive/closed)
- Application tracking per job

**Table Columns**:
- Job title and company
- Location (remote/hybrid/onsite)
- Salary range
- Posted date
- Application count
- Status
- Actions (view, edit, delete)

### 5. Shared Admin Components

#### AdminTable Component
**File**: `src/components/admin/AdminTable.tsx` (new)
- Reusable data table with sorting, pagination, search
- Configurable columns and actions
- Loading states and error handling
- Responsive design

#### AdminModal Component  
**File**: `src/components/admin/AdminModal.tsx` (new)
- Consistent modal styling and behavior
- Form integration
- Confirmation dialogs
- Mobile-responsive

#### AdminStats Component
**File**: `src/components/admin/AdminStats.tsx` (new)
- Metric cards with icons and trend indicators
- Loading skeletons
- Error states

## Data Models

### User Management Data Types
```typescript
interface AdminUser extends User {
  lastLoginAt?: string;
  registrationSource: 'email' | 'google';
  profileCompleteness: number;
  resumeStatus: 'none' | 'uploaded' | 'parsed' | 'error';
}

interface UserFilters {
  role?: 'candidate' | 'admin';
  trialStatus?: 'active' | 'expired' | 'subscribed';
  registrationDateRange?: { start: Date; end: Date };
  search?: string;
}

interface UserTableRow {
  id: string;
  name: string;
  email: string;
  role: string;
  picture?: string;
  createdAt: string;
  trialStatus: string;
  lastActivity?: string;
  isCompleted: boolean;
}
```

### Job Management Data Types
```typescript
interface AdminJobOpportunity {
  id: number;
  title: string;
  company: string;
  location: string;
  locationType: 'remote' | 'hybrid' | 'onsite';
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  requirements: string[];
  benefits: string[];
  status: 'active' | 'inactive' | 'closed';
  postedAt: string;
  expiresAt?: string;
  applicationCount: number;
  viewCount: number;
  createdBy: string;
  updatedAt: string;
}

interface JobFilters {
  status?: 'active' | 'inactive' | 'closed';
  locationType?: 'remote' | 'hybrid' | 'onsite';
  salaryRange?: { min: number; max: number };
  postedDateRange?: { start: Date; end: Date };
  search?: string;
}
```

### Dashboard Analytics Data Types
```typescript
interface DashboardMetrics {
  totalUsers: number;
  userGrowth: number; // percentage
  activeJobs: number;
  jobGrowth: number; // percentage
  recentRegistrations: number;
  totalApplications: number;
  applicationGrowth: number; // percentage
}

interface ChartData {
  userRegistrations: Array<{ date: string; count: number }>;
  jobPostings: Array<{ date: string; count: number }>;
  userRoles: Array<{ role: string; count: number }>;
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'job_posted' | 'application_submitted';
  description: string;
  timestamp: string;
  userId?: string;
  jobId?: number;
}
```

## API Endpoints

### User Management APIs
```typescript
// Extend existing api.ts
export const adminUserAPI = {
  // Get paginated users with filtering
  getUsers: async (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
    trialStatus?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<PagedResult<AdminUser>>> => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  // Get single user details
  getUser: async (id: string): Promise<ApiResponse<AdminUser>> => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  // Update user (admin can modify any field)
  updateUser: async (id: string, userData: Partial<AdminUser>): Promise<ApiResponse<AdminUser>> => {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },

  // Delete user account
  deleteUser: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  // Create new user (admin creation)
  createUser: async (userData: {
    name: string;
    email: string;
    role: 'candidate' | 'admin';
    password?: string;
  }): Promise<ApiResponse<AdminUser>> => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },
};
```

### Job Management APIs
```typescript
export const adminJobAPI = {
  // Get paginated jobs with filtering
  getJobs: async (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    locationType?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<PagedResult<AdminJobOpportunity>>> => {
    const response = await api.get('/admin/jobs', { params });
    return response.data;
  },

  // Get single job details with applications
  getJob: async (id: number): Promise<ApiResponse<AdminJobOpportunity & { applications: JobApplication[] }>> => {
    const response = await api.get(`/admin/jobs/${id}`);
    return response.data;
  },

  // Create new job posting
  createJob: async (jobData: Omit<AdminJobOpportunity, 'id' | 'createdBy' | 'postedAt' | 'updatedAt' | 'applicationCount' | 'viewCount'>): Promise<ApiResponse<AdminJobOpportunity>> => {
    const response = await api.post('/admin/jobs', jobData);
    return response.data;
  },

  // Update job posting
  updateJob: async (id: number, jobData: Partial<AdminJobOpportunity>): Promise<ApiResponse<AdminJobOpportunity>> => {
    const response = await api.put(`/admin/jobs/${id}`, jobData);
    return response.data;
  },

  // Delete job posting
  deleteJob: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/admin/jobs/${id}`);
    return response.data;
  },
};
```

### Dashboard Analytics APIs
```typescript
export const adminAnalyticsAPI = {
  // Get dashboard metrics
  getMetrics: async (): Promise<ApiResponse<DashboardMetrics>> => {
    const response = await api.get('/admin/analytics/metrics');
    return response.data;
  },

  // Get chart data for visualizations
  getChartData: async (timeRange: '7d' | '30d' | '90d' | '1y'): Promise<ApiResponse<ChartData>> => {
    const response = await api.get(`/admin/analytics/charts?range=${timeRange}`);
    return response.data;
  },

  // Get recent activity feed
  getRecentActivity: async (limit: number = 10): Promise<ApiResponse<RecentActivity[]>> => {
    const response = await api.get(`/admin/analytics/activity?limit=${limit}`);
    return response.data;
  },
};
```

## Error Handling

### Frontend Error Handling
- **API Errors**: Consistent error toast notifications using react-hot-toast
- **Loading States**: Skeleton loaders and spinners for better UX
- **Form Validation**: Client-side validation with error messages
- **Network Errors**: Retry mechanisms and offline indicators
- **Permission Errors**: Redirect to 401 page for unauthorized access

### Error Boundaries
- Implement React Error Boundaries for component-level error handling
- Graceful degradation when admin features fail
- Error reporting for debugging

## Testing Strategy

### Unit Testing
- Component rendering tests using React Testing Library
- API service function tests with mocked responses
- Utility function tests for data formatting and validation
- Form validation logic tests

### Integration Testing
- Admin authentication flow testing
- CRUD operation workflows (create, read, update, delete)
- Search and filtering functionality
- Pagination behavior

### E2E Testing (Optional)
- Admin login and navigation flow
- User management complete workflow
- Job management complete workflow
- Dashboard metrics loading and display

### Testing Tools
- **Unit/Integration**: Vitest + React Testing Library (existing setup)
- **Mocking**: MSW (Mock Service Worker) for API mocking
- **Coverage**: Built-in Vitest coverage reporting

## Security Considerations

### Authentication & Authorization
- JWT token validation on all admin endpoints
- Role-based access control (admin role required)
- Token refresh handling for long admin sessions
- Secure logout with token invalidation

### Data Protection
- Input sanitization for all form inputs
- XSS prevention in user-generated content display
- CSRF protection through proper HTTP methods
- Rate limiting on admin API endpoints

### Audit Logging
- Log all admin actions (user modifications, job changes)
- Track admin login/logout events
- Monitor failed authentication attempts
- Data export/deletion audit trails

## Performance Optimization

### Frontend Performance
- **Code Splitting**: Lazy load admin components to reduce main bundle size
- **Memoization**: Use React.memo for expensive list components
- **Virtual Scrolling**: For large user/job lists (if needed)
- **Image Optimization**: Lazy loading and proper sizing for profile pictures

### API Performance
- **Pagination**: Implement efficient pagination for large datasets
- **Caching**: Cache dashboard metrics with appropriate TTL
- **Database Indexing**: Ensure proper indexes on searchable fields
- **Query Optimization**: Optimize database queries for admin endpoints

### Bundle Optimization
- Tree shaking for unused dependencies
- Minimize admin-specific dependencies
- Compress and optimize assets
- Use CDN for static assets

## Accessibility

### WCAG 2.1 Compliance
- **Keyboard Navigation**: Full keyboard accessibility for all admin functions
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Meet WCAG AA standards for all text and UI elements
- **Focus Management**: Clear focus indicators and logical tab order

### Responsive Design
- Mobile-first approach for admin interface
- Touch-friendly controls for mobile devices
- Proper viewport handling
- Flexible layouts that work on all screen sizes

## Migration and Deployment

### Existing Code Integration
- Extend current AdminDashboard component without breaking changes
- Add new routes to existing router configuration
- Integrate with existing authentication system
- Maintain current admin styling patterns

### Database Considerations
- No new database schema changes required initially
- Leverage existing User and JobOpportunity models
- Add analytics/metrics calculation queries
- Consider adding admin action logging table (future enhancement)

### Deployment Strategy
- Feature flags for gradual rollout
- Backward compatibility with existing admin features
- Database migration scripts (if needed)
- Environment variable configuration for new features
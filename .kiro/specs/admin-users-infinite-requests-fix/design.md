# Design Document

## Overview

The admin users page is experiencing an infinite request loop caused by improper React hook dependency management. The `fetchUsers` function is wrapped in `useCallback` with dependencies that include the entire `filters` and `pagination` objects, causing the function to be recreated on every state change, which triggers the `useEffect` to run repeatedly.

## Architecture

### Current Problem Analysis

The current implementation has these issues:

1. **Unstable Dependencies**: The `useCallback` for `fetchUsers` depends on `filters` and `pagination` objects that are recreated on every render
2. **Cascading Re-renders**: State updates trigger new function creation, which triggers `useEffect`, which triggers more state updates
3. **Object Reference Instability**: Filter and pagination objects are not memoized, causing dependency arrays to always see "new" values

### Solution Architecture

The fix involves three main strategies:

1. **Stable Reference Management**: Use `useMemo` for filter and pagination objects to maintain stable references
2. **Optimized Dependencies**: Restructure `useCallback` dependencies to only include primitive values that actually change
3. **Separated Concerns**: Split the fetch logic to handle different trigger scenarios independently

## Components and Interfaces

### Modified State Management

```typescript
// Current problematic approach
const [filters, setFilters] = useState<UserFilters>({...});
const [pagination, setPagination] = useState({...});

// Fixed approach with stable references
const filters = useMemo(() => ({
  search: searchTerm,
  role: roleFilter,
  trialStatus: trialStatusFilter,
  sortBy: sortBy,
  sortOrder: sortOrder
}), [searchTerm, roleFilter, trialStatusFilter, sortBy, sortOrder]);

const pagination = useMemo(() => ({
  currentPage,
  pageSize,
  totalPages,
  totalCount
}), [currentPage, pageSize, totalPages, totalCount]);
```

### Optimized Fetch Function

```typescript
// Current problematic approach
const fetchUsers = useCallback(async () => {
  // ... fetch logic
}, [pagination.currentPage, pagination.pageSize, filters, handleError, handleAuthError]);

// Fixed approach with primitive dependencies
const fetchUsers = useCallback(async () => {
  // ... fetch logic
}, [currentPage, pageSize, searchTerm, roleFilter, trialStatusFilter, sortBy, sortOrder]);
```

### Separated State Variables

Instead of complex objects, use individual state variables:

```typescript
// Pagination state
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(20);
const [totalPages, setTotalPages] = useState(1);
const [totalCount, setTotalCount] = useState(0);

// Filter state
const [searchTerm, setSearchTerm] = useState('');
const [roleFilter, setRoleFilter] = useState('');
const [trialStatusFilter, setTrialStatusFilter] = useState('');
const [sortBy, setSortBy] = useState('createdAt');
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
```

## Data Models

### Request Parameters Interface

```typescript
interface UserRequestParams {
  page: number;
  pageSize: number;
  search?: string;
  role?: string;
  trialStatus?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}
```

### Component State Structure

```typescript
interface AdminUsersState {
  // Data state
  users: AdminUser[];
  loading: boolean;
  error: string | null;
  
  // Pagination state (individual primitives)
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  
  // Filter state (individual primitives)
  searchTerm: string;
  roleFilter: string;
  trialStatusFilter: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  
  // Modal states
  selectedUser: AdminUser | null;
  showUserModal: boolean;
  showCreateModal: boolean;
  showDeleteModal: boolean;
  modalLoading: boolean;
}
```

## Error Handling

### Request Loop Prevention

1. **Dependency Validation**: Ensure `useCallback` and `useEffect` dependencies only include primitive values that actually trigger meaningful changes
2. **Error State Isolation**: Prevent error states from triggering additional requests
3. **Loading State Management**: Ensure loading states don't interfere with dependency calculations

### Error Recovery Strategy

```typescript
const handleFetchError = useCallback((error: any) => {
  setLoading(false);
  
  // Don't trigger additional requests on error
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    handleAuthError(error, { context: 'Fetching users' });
  } else {
    setError(error.message || 'Failed to fetch users');
  }
}, [handleAuthError]);
```

## Testing Strategy

### Unit Tests

1. **Hook Behavior Tests**: Verify that `useCallback` and `useEffect` don't create infinite loops
2. **State Management Tests**: Ensure state updates don't trigger unnecessary re-renders
3. **Dependency Array Tests**: Validate that dependency arrays only change when expected

### Integration Tests

1. **Request Counting**: Verify that only expected number of API requests are made
2. **Filter Change Tests**: Ensure filter changes trigger exactly one new request
3. **Pagination Tests**: Verify pagination changes don't cause multiple requests

### Performance Tests

1. **Re-render Counting**: Monitor component re-renders to ensure they're minimized
2. **Memory Leak Detection**: Ensure no memory leaks from infinite loops
3. **Network Request Monitoring**: Track actual network requests to verify fix

## Implementation Steps

### Phase 1: State Restructuring
1. Replace object-based state with individual primitive state variables
2. Update all state setters to work with new structure
3. Ensure UI components still receive correct data

### Phase 2: Hook Optimization
1. Rewrite `useCallback` dependencies to use primitive values
2. Add `useMemo` for computed objects that need stable references
3. Update `useEffect` dependency arrays

### Phase 3: Error Handling Enhancement
1. Ensure error states don't trigger additional requests
2. Add proper error recovery mechanisms
3. Implement request deduplication if needed

### Phase 4: Testing and Validation
1. Test that infinite loops are eliminated
2. Verify all functionality still works correctly
3. Performance testing to ensure improvements

## Performance Considerations

### Memory Usage
- Eliminate infinite request loops that consume memory
- Reduce unnecessary re-renders through proper memoization
- Clean up any potential memory leaks

### Network Efficiency
- Ensure only necessary API requests are made
- Implement proper request cancellation if component unmounts
- Add request deduplication for rapid filter changes

### User Experience
- Maintain responsive UI during legitimate loading states
- Provide clear feedback for actual loading vs. error states
- Ensure smooth transitions between different data states
# HireThemNow API Test Suite

This is a comprehensive test suite for the HireThemNow API endpoints running on `localhost:8080`.

## Overview

The test suite covers all major API endpoints:

- **Health API** (`/api/health`) - System health checks
- **Authentication API** (`/api/auth`) - User registration, login, Google OAuth, profile
- **Resume API** (`/api/resume`) - Resume upload, analysis, download
- **Mailbox API** (`/api/mailbox`) - Email management and retrieval
- **Jobs API** (`/api/jobs`) - Job listings, search, CRUD operations

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Docker** with the HireThemNow API running on `localhost:8080`
3. **npm** or **yarn** for package management

## Setup

1. Navigate to the test directory:
```bash
cd api-tests
```

2. Install dependencies:
```bash
npm install
```

3. Ensure the API is running on localhost:8080:
```bash
# Check if API is responding
curl http://localhost:8080/api/health
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Health tests only
npm run test:health

# Authentication tests only
npm run test:auth

# Resume tests only
npm run test:resume

# Mailbox tests only
npm run test:mailbox

# Jobs tests only
npm run test:jobs
```

## Test Configuration

### Environment Variables

Create a `.env` file or modify the existing one:

```bash
# API Configuration
BASE_URL=http://localhost:8080
API_BASE_URL=http://localhost:8080/api

# Test Credentials
TEST_EMAIL=test@example.com
TEST_PASSWORD=testpassword123
TEST_NAME=Test User
```

### Test Data

The tests automatically generate unique test data for each run to avoid conflicts:
- Users with timestamps in email addresses
- Jobs with unique titles and companies
- Resume files with test content

## Test Features

### 🔒 Authentication Testing
- User registration and login
- JWT token validation
- Google OAuth integration
- Profile management
- Authorization checks

### 📄 File Upload Testing
- Resume file uploads (PDF, DOC, DOCX)
- File validation (type, size)
- Multipart form data handling
- File download verification

### 🔍 Search and Filtering
- Job search with multiple filters
- Pagination testing
- Performance validation
- Error handling

### 📧 Email Management
- Mailbox email retrieval
- Authentication integration
- Data validation
- Error scenarios

### 🛡️ Security Testing
- Authentication bypass attempts
- Invalid token handling
- Role-based access control
- Input validation

### ⚡ Performance Testing
- Response time validation
- Concurrent request handling
- Large dataset handling
- Memory usage optimization

## Test Structure

```
api-tests/
├── utils/
│   └── testUtils.js          # Shared utilities and helpers
├── tests/
│   ├── health.test.js        # Health endpoint tests
│   ├── auth.test.js          # Authentication tests
│   ├── resume.test.js        # Resume API tests
│   ├── mailbox.test.js       # Mailbox API tests
│   └── jobs.test.js          # Jobs API tests
├── package.json              # Dependencies and scripts
├── .env                      # Environment configuration
└── README.md                 # This file
```

## Test Results

### Expected Outcomes

✅ **Health Tests**: Verify API availability and basic responses
✅ **Auth Tests**: Complete authentication flow validation
✅ **Resume Tests**: File upload, storage, and retrieval
✅ **Mailbox Tests**: Email data retrieval and formatting
✅ **Jobs Tests**: Job search, filtering, and CRUD operations

### Troubleshooting

**API Not Available**
```bash
# Check if Docker container is running
docker ps

# Check API health
curl http://localhost:8080/api/health
```

**Authentication Failures**
- Verify JWT secret configuration
- Check token expiration settings
- Validate user creation process

**File Upload Issues**
- Confirm S3 bucket configuration
- Check file size limits (2MB)
- Verify supported file types

**Database Errors**
- Check database connection
- Verify migrations are applied
- Check user permissions

## CI/CD Integration

This test suite can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run API Tests
  run: |
    npm install
    npm test
  env:
    BASE_URL: http://localhost:8080
```

## Contributing

When adding new tests:

1. Follow existing naming conventions
2. Use shared utilities from `testUtils.js`
3. Clean up test data in `afterEach` hooks
4. Add proper error handling and assertions
5. Update this README with new test descriptions

## API Endpoints Tested

### Health Endpoints
- `GET /api/health` - Health check
- `GET /api/health/test` - Test endpoint

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Resume Endpoints
- `POST /api/resume/upload` - Upload resume file
- `GET /api/resume/analysis` - Get resume analysis
- `GET /api/resume/download` - Download resume file

### Mailbox Endpoints
- `GET /api/mailbox/emails` - Get user emails

### Jobs Endpoints
- `GET /api/jobs` - Get jobs with filters
- `GET /api/jobs/:id` - Get specific job
- `POST /api/jobs` - Create job (employer only)
- `PUT /api/jobs/:id` - Update job (employer only)
- `DELETE /api/jobs/:id` - Delete job (employer only)

## Test Coverage

The test suite provides comprehensive coverage including:
- ✅ Happy path scenarios
- ✅ Error conditions and edge cases
- ✅ Authentication and authorization
- ✅ Input validation
- ✅ File handling
- ✅ Performance characteristics
- ✅ Data integrity
- ✅ Security vulnerabilities
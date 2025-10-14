# HireThemNow Steering Documentation

Welcome to the HireThemNow steering documentation! This directory contains comprehensive guides and references for working with the HireThemNow application.

## What is Steering?

Steering documents provide context and instructions that help Kiro (and developers) understand the application architecture, standards, and workflows. These documents are automatically included when working with Kiro to ensure consistent, high-quality code generation and modifications.

## Available Documentation

### 📋 [Application Overview](./application-overview.md)
High-level overview of the HireThemNow platform, including:
- Technology stack (ASP.NET Core 8, React 18, PostgreSQL)
- Key features (two-phase resume processing, comprehensive ATS analysis, job tracking)
- Service architecture with ResumeAnalysisService and dual-phase background processing
- Request flow and processing architecture
- Project structure
- Environment configuration
- Live URLs and deployment info

**Use this when**: You need to understand what the application does and how it's structured.

---

### 🗄️ [Database Schema](./database-schema.md)
Complete database schema documentation, including:
- All tables and columns with descriptions (including ResumeAnalysis table)
- Data types and constraints
- Relationships and foreign keys (ResumeContent ↔ ResumeAnalysis)
- Indexes and performance considerations (analysis status indexing)
- JSON column formats (analysis results, section feedback)
- Migration commands
- Best practices

**Use this when**: Working with database models, creating migrations, or querying data.

---

### 🔌 [API Endpoints](./api-endpoints.md)
Comprehensive API documentation covering:
- All endpoints with request/response examples
- Authentication requirements
- Error handling and status codes
- CORS configuration
- Rate limiting (future)
- API versioning (future)

**Endpoints covered**:
- Authentication (login, register, Google OAuth)
- User management (profile, picture upload)
- Resume operations (upload, download, parsing status)
- **Resume analysis (status, results, retry)** - New comprehensive ATS analysis endpoints
- AI agent (resume analysis)
- Email preferences
- Privacy settings
- Data export/deletion
- Industries and skills
- Release notes
- Health checks

**Use this when**: Implementing frontend features, testing APIs, or adding new endpoints.

---

### 📄 [Resume Parsing System](./resume-parsing.md)
Detailed documentation of the two-phase resume processing system:
- **Phase 1**: Resume parsing (PdfPig + AWS Bedrock for structuring)
- **Phase 2**: ATS analysis (AWS Bedrock for detailed scoring and recommendations)
- Sequential processing architecture with automatic transitions
- Dual Bedrock configuration (parsing vs analysis optimized settings)
- Background service coordination of both phases
- Configuration options (parsing and analysis parameters)
- Supported formats (PDF only)
- Error handling and retry mechanisms
- Performance metrics and monitoring
- AWS permissions required
- Testing strategies
- Troubleshooting

**Use this when**: Working on resume upload, parsing, analysis, or AI integration features.

---

### ☁️ [AWS Services](./aws-services.md)
Complete guide to AWS services used:
- Elastic Beanstalk (backend hosting)
- S3 (file storage)
- RDS (PostgreSQL database)
- **Bedrock (dual-purpose AI: parsing + analysis)** - Enhanced with separate configurations
- SES (email notifications)
- CloudFront (CDN)
- ACM (SSL certificates)
- IAM (access management)

Each service includes:
- Configuration details (including analysis-specific Bedrock settings)
- Permissions required
- Cost optimization tips (dual-phase processing considerations)
- Monitoring and alerts (analysis-specific metrics)
- Troubleshooting

**Use this when**: Deploying, configuring AWS services, or troubleshooting infrastructure issues.

---

### 💻 [Coding Standards](./coding-standards.md)
Coding standards and best practices for:
- C# / .NET backend (including ResumeAnalysisController patterns)
- TypeScript / React frontend
- Database queries
- Testing
- Git commits
- Security
- Performance

Includes:
- Naming conventions
- File organization
- Code examples (good vs bad) with analysis service patterns
- Error handling patterns (status-based responses)
- Dependency injection (service registration examples)
- Logging standards (structured logging for analysis operations)
- Security best practices

**Use this when**: Writing new code, reviewing pull requests, or establishing team standards.

---

### 🚀 [Deployment Guide](./deployment-guide.md)
Step-by-step deployment procedures:
- Prerequisites and setup
- Local development
- Backend deployment (automated and manual)
- Frontend deployment (automated and manual)
- Database setup and migrations
- SSL certificate configuration
- Custom domain setup
- **Environment variables (including all ResumeParsing analysis configuration)**
- **Service dependencies (ResumeAnalysisService registration)**
- Monitoring and logging (analysis-specific CloudWatch patterns)
- Rollback procedures
- **Analysis system troubleshooting**
- CI/CD pipeline (future)
- Backup and disaster recovery

**Use this when**: Deploying to production, setting up environments, or troubleshooting deployment issues.

---

## Quick Reference

### Common Tasks

**Adding a new API endpoint**:
1. Review [API Endpoints](./api-endpoints.md) for patterns
2. Follow [Coding Standards](./coding-standards.md) for controller structure
3. Update [Database Schema](./database-schema.md) if needed
4. Test with examples from API docs

**Working with resume processing (parsing + analysis)**:
1. Read [Resume Parsing System](./resume-parsing.md) for two-phase architecture
2. Check [AWS Services](./aws-services.md) for dual Bedrock configuration
3. Review [API Endpoints](./api-endpoints.md) for analysis endpoints
4. Follow error handling patterns from [Coding Standards](./coding-standards.md)

**Working with resume analysis**:
1. Review [API Endpoints](./api-endpoints.md) for analysis status and results endpoints
2. Check [Database Schema](./database-schema.md) for ResumeAnalysis table structure
3. Follow [Coding Standards](./coding-standards.md) for status-based response patterns
4. Use [Deployment Guide](./deployment-guide.md) for analysis troubleshooting

**Deploying changes**:
1. Follow [Deployment Guide](./deployment-guide.md) procedures
2. Check [AWS Services](./aws-services.md) for service configuration
3. Monitor using CloudWatch (see Deployment Guide)

**Database changes**:
1. Review [Database Schema](./database-schema.md) for existing structure
2. Create migration following [Coding Standards](./coding-standards.md)
3. Test locally before deploying
4. Deploy using [Deployment Guide](./deployment-guide.md)

### Analysis Endpoints Quick Reference

**Key Analysis Endpoints**:
- `GET /api/resume/analysis/status` - Check analysis progress
- `GET /api/resume/analysis/results` - Get detailed ATS scores and recommendations
- `POST /api/resume/analysis/retry` - Retry failed analysis

**Analysis Status Values**:
- `waiting_for_parsing` - Resume being parsed, analysis will start automatically
- `processing` - Analysis currently running (10-15 seconds)
- `completed` - Analysis finished with results available
- `failed` - Analysis failed, retry available

**Common Analysis Tasks**:
- Check analysis status after resume upload
- Handle processing states with appropriate UI feedback
- Implement retry functionality for failed analyses
- Display comprehensive ATS scores and actionable recommendations

---

## Document Maintenance

These steering documents should be updated when:
- New features are added
- Architecture changes
- API endpoints are modified
- Database schema changes
- Deployment procedures change
- New AWS services are added
- Coding standards evolve

---

## Technology Stack Summary

### Backend
- **Framework**: ASP.NET Core 8 (C#)
- **Database**: PostgreSQL 17.4
- **ORM**: Entity Framework Core
- **Authentication**: JWT + Google OAuth
- **Hosting**: AWS Elastic Beanstalk

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Hosting**: AWS S3 + CloudFront

### AWS Services
- **S3**: File storage
- **Bedrock**: Dual-purpose AI (Amazon Nova Pro for parsing + analysis)
- **RDS**: PostgreSQL database
- **SES**: Email notifications
- **CloudFront**: CDN
- **ACM**: SSL certificates

### PDF Processing
- **PdfPig**: Text extraction (no AWS Textract)

---

## Live URLs

- **Frontend**: https://hirethemnow.xyz
- **API**: https://api.hirethemnow.xyz
- **Documentation**: This directory

---

## Getting Help

1. **Check relevant steering document** for your task
2. **Search existing code** for similar patterns
3. **Review API documentation** for endpoint details
4. **Check deployment guide** for infrastructure issues
5. **Ask Kiro** with context from steering docs

---

## Contributing

When updating steering documents:
1. Keep information accurate and up-to-date
2. Use clear, concise language
3. Include code examples where helpful
4. Update cross-references between documents
5. Follow markdown formatting standards

---

## Version History

- **v1.1** (2025-10-14): Updated for comprehensive ATS analysis system
  - Enhanced application overview with two-phase processing architecture
  - Updated database schema with ResumeAnalysis table and relationships
  - Added comprehensive analysis API endpoints documentation
  - Enhanced resume parsing system with dual-phase processing
  - Updated AWS services with dual Bedrock configuration
  - Added analysis-specific coding standards and patterns
  - Enhanced deployment guide with analysis configuration and troubleshooting

- **v1.0** (2025-10-09): Initial steering documentation created
  - Application overview
  - Database schema
  - API endpoints
  - Resume parsing system
  - AWS services
  - Coding standards
  - Deployment guide

---

## Contact

For questions or updates to this documentation, please contact the development team or update the documents directly in the `.kiro/steering/` directory.

# HireThemNow Steering Documentation

Welcome to the HireThemNow steering documentation! This directory contains comprehensive guides and references for working with the HireThemNow application.

## What is Steering?

Steering documents provide context and instructions that help Kiro (and developers) understand the application architecture, standards, and workflows. These documents are automatically included when working with Kiro to ensure consistent, high-quality code generation and modifications.

## Available Documentation

### 📋 [Application Overview](./application-overview.md)
High-level overview of the HireThemNow platform, including:
- Technology stack (ASP.NET Core 8, React 18, PostgreSQL)
- Key features (resume parsing, ATS scoring, job tracking)
- Architecture and request flow
- Project structure
- Environment configuration
- Live URLs and deployment info

**Use this when**: You need to understand what the application does and how it's structured.

---

### 🗄️ [Database Schema](./database-schema.md)
Complete database schema documentation, including:
- All tables and columns with descriptions
- Data types and constraints
- Relationships and foreign keys
- Indexes and performance considerations
- JSON column formats
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
Detailed documentation of the resume parsing system:
- Two-stage parsing (PdfPig + AWS Bedrock)
- Processing flow and architecture
- Configuration options
- Supported formats (PDF only)
- Background processing
- Error handling
- Performance metrics
- AWS permissions required
- Testing strategies
- Troubleshooting

**Use this when**: Working on resume upload, parsing, or AI integration features.

---

### ☁️ [AWS Services](./aws-services.md)
Complete guide to AWS services used:
- Elastic Beanstalk (backend hosting)
- S3 (file storage)
- RDS (PostgreSQL database)
- Bedrock (AI resume parsing)
- SES (email notifications)
- CloudFront (CDN)
- ACM (SSL certificates)
- IAM (access management)

Each service includes:
- Configuration details
- Permissions required
- Cost optimization tips
- Monitoring and alerts
- Troubleshooting

**Use this when**: Deploying, configuring AWS services, or troubleshooting infrastructure issues.

---

### 💻 [Coding Standards](./coding-standards.md)
Coding standards and best practices for:
- C# / .NET backend
- TypeScript / React frontend
- Database queries
- Testing
- Git commits
- Security
- Performance

Includes:
- Naming conventions
- File organization
- Code examples (good vs bad)
- Error handling patterns
- Dependency injection
- Logging standards
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
- Monitoring and logging
- Rollback procedures
- Troubleshooting
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

**Working with resume parsing**:
1. Read [Resume Parsing System](./resume-parsing.md) for architecture
2. Check [AWS Services](./aws-services.md) for Bedrock configuration
3. Follow error handling patterns from [Coding Standards](./coding-standards.md)

**Deploying changes**:
1. Follow [Deployment Guide](./deployment-guide.md) procedures
2. Check [AWS Services](./aws-services.md) for service configuration
3. Monitor using CloudWatch (see Deployment Guide)

**Database changes**:
1. Review [Database Schema](./database-schema.md) for existing structure
2. Create migration following [Coding Standards](./coding-standards.md)
3. Test locally before deploying
4. Deploy using [Deployment Guide](./deployment-guide.md)

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
- **Bedrock**: AI resume parsing (Amazon Nova Pro)
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

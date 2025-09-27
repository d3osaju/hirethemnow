# HireThemNow 🚀

**AI-Powered Automated Job Hunting Platform** - Upload your resume, let AI analyze it, scrape HR contacts, and automatically send personalized cold emails to get you interviews.

## 🎯 What It Does

1. **Simple Onboarding**: Users upload resume + name only
2. **AI Resume Analysis**: Extracts skills, experience, education + generates 5 cold email templates
3. **HR Contact Scraping**: Finds relevant HR contacts grouped by industry/skills
4. **Automated Cold Emails**: Sends personalized emails via testmail.app
5. **Smart Mailbox**: Shows sent emails and replies with AI sentiment analysis badges (Interview/Rejection/Positive/Negative)

## 🏗️ Architecture

```
Frontend (React 19 + TypeScript)
├── Development: http://localhost:5173 → http://localhost:8080/api
└── Production: http://localhost:8080 (Docker)

Backend (ASP.NET Core 8)
├── Development: http://localhost:8080 (Docker container)
└── Production: AWS Fargate (containerized)

N8N Workflows (Automation)
├── Resume Analysis → AI extracts skills + generates email templates
├── HR Scraping → Finds contacts by industry/skills
└── Cold Email Campaign → Sends emails + tracks responses
```

## 🚀 Quick Start

### Production Deployment (One Command)
```bash
# Deploy complete application
docker-compose up --build -d

# Access at: http://localhost:8080
```

### Development
```bash
# Backend (Terminal 1)
cd HireThemNoW.Server && dotnet run

# Frontend (Terminal 2)
cd hirethemnow.client && npm run dev
```

### Quick Deploy Script
```powershell
# One command: lint + type-check + build + commit + push
.\quick-deploy.ps1

# With custom message
.\quick-deploy.ps1 -Message "feat: add amazing feature"
```

## 🔧 Tech Stack

### Frontend
- **React 19** + **TypeScript** - UI framework with type safety
- **Vite** - Lightning fast build tool
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side navigation
- **Lucide React** - Beautiful icons

### Backend
- **ASP.NET Core 8** - Web API framework
- **Entity Framework Core** - ORM with SQLite
- **JWT Authentication** - Secure token-based auth
- **Swagger/OpenAPI** - API documentation

### Automation
- **N8N** - Workflow automation platform
- **testmail.app** - Email sending/tracking service
- **AI Integration** - Resume analysis + email sentiment

### Infrastructure
- **Docker** - Containerized deployment
- **SQLite** - Embedded database (cost-effective)
- **AWS Fargate** - Serverless containers (production)
- **GitHub Actions** - CI/CD pipeline

## 📋 Available Commands

### Development
```bash
# Frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # ESLint code quality check
npm run type-check   # TypeScript validation

# Backend
dotnet run           # Start API server
dotnet build         # Build project
dotnet publish       # Publish for production

# Quick Deploy (All-in-one)
.\quick-deploy.ps1   # Lint + build + commit + push
```

### Docker Production
```bash
docker-compose up --build -d     # Deploy production
docker-compose ps               # Check status
docker-compose logs             # View logs
docker-compose down             # Stop services
```

## 🤖 N8N Workflow Integration

The application integrates with N8N for automation via webhooks:

### 1. Resume Analysis Workflow
- **Trigger**: User uploads resume
- **Process**: AI analyzes resume → extracts skills/experience → generates 5 cold email templates
- **Webhook**: `POST /api/resume/analysis/result`

### 2. HR Scraping Workflow
- **Trigger**: Resume analysis complete
- **Process**: Scrapes HR contacts from web → groups by industry/skills
- **Webhook**: `POST /api/hrcontacts/bulk`

### 3. Cold Email Campaign
- **Trigger**: HR contacts available
- **Process**: Sends personalized emails via testmail.app → tracks responses
- **Webhook**: `POST /api/coldemail/outreach/sent`

### 4. Email Analysis
- **Trigger**: Reply received
- **Process**: AI analyzes sentiment → detects interviews/rejections
- **Webhook**: `POST /api/mailbox/analysis/result`

### Configuration
Update N8N webhook URLs in your environment:
```bash
N8N_RESUME_ANALYSIS_WEBHOOK=https://your-n8n-instance.com/webhook/resume-analysis
N8N_HR_SCRAPING_WEBHOOK=https://your-n8n-instance.com/webhook/hr-scraping
N8N_COLD_EMAIL_WEBHOOK=https://your-n8n-instance.com/webhook/cold-email-campaign
TESTMAIL_API_KEY=your-testmail-api-key
```

## 🔒 Pre-Commit Quality Checks

Automated code quality enforcement using **Husky** + **lint-staged**:

### What Runs Before Every Commit:
- ✅ **ESLint** - Code quality + auto-fix
- ✅ **TypeScript** - Type checking
- ✅ **Prettier** - Code formatting
- ✅ **Only staged files** processed (fast!)

### Manual Commands:
```bash
cd hirethemnow.client

npm run lint         # Check code quality
npm run type-check   # Validate TypeScript
npm run pre-commit   # Run all checks manually
```

### Bypass (Emergency Only):
```bash
git commit --no-verify -m "Emergency commit"
```

## 🌟 Key Features

### User Experience
- **Simplified Onboarding**: Just upload resume + name
- **Automated Everything**: No manual job searching needed
- **Smart Mailbox**: AI-analyzed email responses with visual badges
- **Real-time Updates**: See campaign progress and responses

### AI-Powered Analysis
- **Resume Parsing**: Extracts skills, experience, education
- **Email Generation**: Creates 5 personalized cold email templates
- **Sentiment Analysis**: Detects interview invitations, rejections, positive/negative responses
- **Smart Categorization**: Groups contacts by industry and skills

### Email Management
- **Automated Sending**: Bulk personalized cold emails
- **Response Tracking**: Monitors replies via testmail.app
- **Status Badges**: Visual indicators for email types:
  - 🟢 **Interview** - Interview invitation detected
  - 🔴 **Rejection** - Rejection email detected
  - 🔵 **Positive** - Positive response detected
  - ⚫ **Negative** - Not interested/negative response

## 📊 User Flow

1. **Registration**: User creates account with email/password
2. **Resume Upload**: Upload PDF/DOC resume file
3. **AI Analysis**: N8N workflow analyzes resume and generates email templates
4. **HR Scraping**: System finds relevant HR contacts based on skills
5. **Campaign Launch**: Automated cold email campaign begins
6. **Response Tracking**: Monitor sent emails and replies in mailbox
7. **Interview Management**: AI flags interview opportunities

## 🔐 Environment Variables

### Required Configuration
```bash
# Database
DATABASE_PASSWORD=hirethem4us

# Authentication
JWT_SECRET=your-jwt-secret-here

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# N8N Integration
N8N_RESUME_ANALYSIS_WEBHOOK=https://your-n8n-instance.com/webhook/resume-analysis
N8N_HR_SCRAPING_WEBHOOK=https://your-n8n-instance.com/webhook/hr-scraping
N8N_COLD_EMAIL_WEBHOOK=https://your-n8n-instance.com/webhook/cold-email-campaign

# Email Service
TESTMAIL_API_KEY=your-testmail-api-key
```

## 📁 Project Structure

```
HireThemNow/
├── hirethemnow.client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── onboarding/      # Resume upload
│   │   │   └── mailbox/         # Email management
│   │   ├── pages/               # Route components
│   │   └── types/               # TypeScript definitions
│   ├── .husky/                  # Git hooks
│   └── package.json             # Frontend dependencies
├── HireThemNoW.Server/          # ASP.NET Core backend
│   ├── Controllers/             # API endpoints
│   ├── Models/                  # Data models
│   ├── Services/                # Business logic
│   └── Program.cs               # Application entry
├── docker-compose.yml           # Production deployment
├── Dockerfile                   # Container configuration
├── quick-deploy.ps1             # Automated deployment script
└── README.md                    # This file
```

## 🚨 Troubleshooting

### Common Issues

1. **Docker Build Failures**
   ```bash
   # Clear Docker cache
   docker system prune -f
   docker-compose build --no-cache
   ```

2. **TypeScript Errors**
   ```bash
   cd hirethemnow.client
   npm run type-check
   # Fix reported errors before committing
   ```

3. **API Connection Issues**
   - Ensure backend is running on port 8080
   - Check `VITE_API_BASE_URL` in frontend
   - Verify CORS configuration in backend

4. **Pre-commit Hook Failures**
   ```bash
   cd hirethemnow.client
   npm run lint:fix     # Auto-fix linting issues
   npm run type-check   # Check for type errors
   ```

### Debug Mode
```bash
# Enable detailed logging
VITE_ENABLE_DEBUG=true
VITE_LOG_LEVEL=debug
```

## 🌍 Deployment Options

### Local Development
- **Quick Start**: `docker-compose up`
- **Separate Services**: Run frontend/backend individually
- **Hot Reload**: Changes reflected immediately

### Production
- **AWS Fargate**: Containerized, auto-scaling, cost-effective (~$15/month)
- **GitHub Actions**: Automated CI/CD pipeline
- **CloudFormation**: Infrastructure as Code

## 🤝 Contributing

1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes
4. **Test** locally: `docker-compose up`
5. **Deploy**: `.\quick-deploy.ps1` (auto-lints, builds, commits, pushes)
6. **Submit** pull request

### Development Workflow
- Pre-commit hooks ensure code quality
- GitHub Actions run full CI pipeline
- All commits must pass lint + type-check
- Semantic commit messages encouraged

## 📄 License

MIT License - Build amazing things! 🎉

---

## 🎯 Getting Started Checklist

- [ ] Clone repository
- [ ] Run `docker-compose up`
- [ ] Access http://localhost:8080
- [ ] Upload test resume
- [ ] Configure N8N workflows (optional)
- [ ] Set up testmail.app integration
- [ ] Deploy to production with GitHub Actions

**Ready to revolutionize job hunting? Let's build the future! 🚀**
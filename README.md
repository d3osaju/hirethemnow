# HireThemNow 🚀

A modern full-stack hiring platform built with React 19, ASP.NET Core 8, and deployed on AWS.

## 🏗️ Architecture

```
Frontend (React 19 + TypeScript)
├── Development: http://localhost:5173 → http://localhost:8080/api (Local Docker)
└── Production: CloudFront → Application Load Balancer

Backend (ASP.NET Core 8)
├── Development: http://localhost:8080 (Docker container)
└── Production: AWS Fargate (containerized, cost-effective)
```

## 🚀 Quick Start

### Local Development

```bash
# Option 1: Docker (Recommended - matches production)
docker-compose up

# Option 2: Manual (for development)
# Backend (ASP.NET Core)
cd HireThemNoW.Server
dotnet run

# Frontend (React + Vite) - in new terminal
cd hirethemnow.client
npm install
npm run dev    # Uses backend at localhost:8080
```

## 🔧 Environment Configuration

| Environment | Command | API Endpoint | Features |
|-------------|---------|--------------|----------|
| **Development** | `docker-compose up` | `http://localhost:8080/api` | Docker container, Mock data fallback, Debug logging |
| **Production** | Deployed to AWS | AWS Fargate + ALB | Containerized API, Cost-effective (~$15/month) |

### Environment Files

- **`.env.local`** - Local development with ASP.NET Core backend
- **`.env.production`** - AWS production environment (auto-generated during deployment)

## 🛠️ Available Scripts

### Frontend
```bash
npm run dev                # Local development
npm run build              # Build for production
npm run build:production   # Build for production
npm run lint               # Lint code
npm run type-check         # TypeScript check
```

### Backend
```bash
dotnet run                 # Start local server
dotnet build              # Build project
dotnet publish            # Publish for deployment
```

## ☁️ GitHub Actions Deployment

### Prerequisites
- GitHub repository
- AWS account with IAM user
- GitHub secrets configured

### Setup Deployment
1. **Configure GitHub Secrets** (see `.github/secrets-template.md`)
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `DATABASE_PASSWORD`

2. **Deploy to Production**
   - Push to `main` branch (automatic)
   - OR manually trigger in GitHub Actions tab

### Deployment Process
- **CI Pipeline**: Runs on all pushes and PRs
- **Production Deploy**: Runs on `main` branch pushes
- **Monitoring**: Check GitHub Actions tab for status

## 🔐 Environment Variables

### Frontend (.env files)
```bash
VITE_APP_ENV=development|production
VITE_API_BASE_URL=https://localhost:7154/api
VITE_APP_NAME=HireThemNow
VITE_ENABLE_DEBUG=true|false
VITE_ENABLE_MOCK_DATA=true|false
VITE_LOG_LEVEL=debug|info|warn|error
```

### Backend (appsettings.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=hirethemnow.db"
  },
  "JWT": {
    "Secret": "your-jwt-secret"
  },
  "GoogleAuth": {
    "ClientId": "your-google-client-id",
    "ClientSecret": "your-google-client-secret"
  }
}
```

## 📦 Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client
- **Lucide React** - Icons

### Backend
- **ASP.NET Core 8** - Web API framework
- **Entity Framework Core** - ORM
- **SQLite** - Database (embedded, cost-effective)
- **JWT** - Authentication
- **Swagger/OpenAPI** - API documentation

### Cloud Infrastructure (AWS)
- **S3 + CloudFront** - Frontend hosting
- **Fargate + Application Load Balancer** - Containerized backend
- **SQLite** - Embedded database (cost-effective for MVP)
- **CloudFormation** - Infrastructure as Code

## 🏃‍♂️ Development Workflow

1. **Local Development**
   ```bash
   # Terminal 1: Backend
   cd HireThemNoW.Server && dotnet run

   # Terminal 2: Frontend
   cd hirethemnow.client && npm run dev
   ```

2. **Deploy to Production**
   ```bash
   git push origin main    # Triggers automatic deployment
   ```

## 🔄 Features

### Authentication
- Email/password registration and login
- Role-based access (Employer/Candidate)
- JWT token management
- Google OAuth integration (configured)

### Job Management
- Job posting (Employers)
- Job browsing and search (Candidates)
- Application management
- Real-time filtering and search

### UI/UX
- Responsive design (mobile-first)
- Modern, clean interface
- Loading states and error handling
- Accessibility compliant

## 💰 Cost Optimization

### Production Environment (~$15-25/month)
- **75% cost reduction** vs traditional Lambda/RDS setup
- Fargate container (512 CPU, 1GB RAM)
- Application Load Balancer
- S3 + CloudFront
- SQLite database (no RDS costs)

### Scaling Options
- Fargate auto-scaling (CPU/memory-based)
- Application Load Balancer distribution
- CloudFront global CDN
- Future: Upgrade to RDS when needed

## 🚨 Troubleshooting

### Common Issues

1. **CORS errors in local development**
   - Ensure backend is running on port 7154
   - Check `VITE_API_BASE_URL` in `.env.local`

2. **Build failures**
   ```bash
   # Clear npm cache
   npm ci

   # Type check
   npm run type-check
   ```

3. **API connection issues**
   - Ensure backend is running on https://localhost:7154
   - Check `.env.local` configuration
   - Verify `import.meta.env` values in browser console

### Debug Mode

Enable debug logging:
```bash
# Set in .env.local or .env.development
VITE_ENABLE_DEBUG=true
VITE_LOG_LEVEL=debug
```

View debug info in browser console and header badge.

## 📈 Monitoring

### Local Development
- Browser DevTools Console
- Network tab for API calls
- React DevTools

### Production
- AWS CloudWatch Logs
- CloudWatch Metrics
- X-Ray tracing (optional)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test locally: `npm run dev:local`
4. Test with dev environment: `npm run dev:development`
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

---

**Getting Started**: Run `npm run dev` and `dotnet run` to start developing! 🎯
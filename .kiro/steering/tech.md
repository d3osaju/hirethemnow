# Technology Stack

## Backend

- **Framework**: ASP.NET Core 8 (.NET 8)
- **Language**: C#
- **Database**: PostgreSQL 17.4 with Entity Framework Core 9.0.9
- **ORM**: Npgsql.EntityFrameworkCore.PostgreSQL 9.0.4
- **Authentication**: JWT + Google OAuth
- **API Documentation**: Swagger/Swashbuckle

### AWS Services

- **S3**: Resume and profile picture storage
- **SES**: Email notifications
- **Bedrock**: AI-powered resume analysis using Amazon Nova Pro model
- **RDS**: PostgreSQL database hosting
- **Elastic Beanstalk**: Application hosting (Windows Server 2022 + IIS 10.0)

### Key NuGet Packages

- AWSSDK.S3 (4.0.7.4), AWSSDK.SimpleEmail (4.0.0.9), AWSSDK.BedrockRuntime (4.0.7.2), AWSSDK.Extensions.NETCore.Setup (4.0.3.1)
- AWSSDK.Textract (4.0.2.6) - PDF text extraction (legacy, now using PdfPig)
- Amazon.Lambda.AspNetCoreServer.Hosting (1.9.0) - AWS Lambda support
- Microsoft.AspNetCore.Authentication.JwtBearer (8.0.0)
- Microsoft.AspNetCore.Authentication.Google (8.0.0)
- System.IdentityModel.Tokens.Jwt (8.14.0)
- Microsoft.IdentityModel.Tokens (8.14.0)
- Google.Apis.Auth (1.68.0)
- PdfPig (0.1.9) - PDF text extraction
- Swashbuckle.AspNetCore (6.6.2) - Swagger/OpenAPI documentation

## Frontend

- **Framework**: React 19.1.1
- **Language**: TypeScript 5.8.3
- **Build Tool**: Vite 7.1.7
- **Styling**: Tailwind CSS 3.4.17
- **Routing**: React Router DOM 7.9.2
- **HTTP Client**: Axios 1.12.2
- **UI Components**: Lucide React 0.544.0 (icons)
- **Notifications**: React Hot Toast 2.6.0
- **Date Handling**: date-fns 4.1.0
- **JWT Decoding**: jwt-decode 4.0.0

### Development Tools

- ESLint 9.36.0 with TypeScript support (typescript-eslint 8.44.0)
- Prettier 3.6.2
- Husky 9.1.7 for git hooks
- lint-staged 16.2.1 for pre-commit checks
- @tailwindcss/forms 0.5.10 for form styling

## Common Commands

### Backend

```bash
# Restore dependencies
cd HireThemNoW.Server
dotnet restore

# Run locally (development)
dotnet run
# Runs at http://localhost:5219

# Build for production
dotnet publish -c Release -o ../publish/app

# Database migrations
dotnet ef migrations add <MigrationName>
dotnet ef database update
```

### Frontend

```bash
# Install dependencies
cd hirethemnow.client
npm install

# Run development server
npm run dev
# Runs at http://localhost:5173

# Build for production
npm run build
# or
npm run build:production

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Preview production build
npm run preview
```

### Deployment

```powershell
# Deploy backend to AWS Elastic Beanstalk
.\deploy-backend.ps1

# Deploy frontend to AWS S3 + CloudFront
.\deploy-frontend.ps1

# Verify deployment status
.\check-deployment.ps1

# Check resume parsing logs
.\check-parsing-logs.ps1

# Test complete application flow
.\test-complete-flow.ps1

# Test IAM configuration
.\test-iam-config.ps1
```

## Platform Requirements

- **.NET 8 SDK** for backend development
- **Node.js 18+** for frontend development
- **AWS CLI** for deployment
- **PowerShell** for running deployment scripts
- **PostgreSQL** for local database (or use AWS RDS)

## Configuration

- Backend configuration: `appsettings.json`, `appsettings.Development.json`, `appsettings.Production.json`
- Frontend environment: `.env.production`
- Deployment credentials: `.env.deploy` (gitignored)
- AWS Elastic Beanstalk: `.elasticbeanstalk/config.yml`

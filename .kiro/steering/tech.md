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
- **Bedrock**: AI-powered resume analysis (optional)
- **RDS**: PostgreSQL database hosting
- **Elastic Beanstalk**: Application hosting (Windows Server 2022 + IIS 10.0)

### Key NuGet Packages

- AWSSDK.S3, AWSSDK.SimpleEmail, AWSSDK.Extensions.NETCore.Setup
- Microsoft.AspNetCore.Authentication.JwtBearer
- Microsoft.AspNetCore.Authentication.Google
- System.IdentityModel.Tokens.Jwt
- Google.Apis.Auth

## Frontend

- **Framework**: React 19
- **Language**: TypeScript 5.8
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 3.4
- **Routing**: React Router DOM 7
- **HTTP Client**: Axios
- **UI Components**: Lucide React (icons)
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

### Development Tools

- ESLint 9 with TypeScript support
- Prettier 3.6
- Husky 9 for git hooks
- lint-staged for pre-commit checks

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

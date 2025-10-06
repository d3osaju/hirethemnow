# Project Structure

## Root Directory

```
HireThemNoW/
├── HireThemNoW.Server/          # Backend ASP.NET Core API
├── hirethemnow.client/          # Frontend React application
├── HireThemNow.Test/            # Integration tests
├── publish/                     # Build output directory
├── .elasticbeanstalk/          # AWS Elastic Beanstalk configuration
├── deploy-backend.ps1          # Backend deployment script
├── deploy-frontend.ps1         # Frontend deployment script
├── .env.deploy                 # Deployment credentials (gitignored)
├── .env.example                # Example environment variables
└── HireThemNoW.sln             # Visual Studio solution file
```

## Backend Structure (HireThemNoW.Server/)

```
HireThemNoW.Server/
├── Controllers/                # API endpoints
├── Data/                       # Database context and configurations
├── Migrations/                 # Entity Framework migrations
├── Models/                     # Domain models and DTOs
├── Services/                   # Business logic and external service integrations
│   ├── IDataService.cs        # Data access interface
│   ├── DatabaseDataService.cs # Database implementation
│   ├── IS3Service.cs          # S3 storage interface
│   ├── S3Service.cs           # S3 implementation
│   ├── IEmailService.cs       # Email service interface
│   ├── EmailService.cs        # SES email implementation
│   └── IBedrockAgentService.cs # AI service interface
├── Properties/                 # Launch settings
├── bin/                        # Build output (gitignored)
├── obj/                        # Build intermediates (gitignored)
├── Program.cs                  # Application entry point and configuration
├── appsettings.json           # Base configuration
├── appsettings.Development.json
├── appsettings.Production.json
└── HireThemNoW.Server.csproj  # Project file
```

## Frontend Structure (hirethemnow.client/)

```
hirethemnow.client/
├── src/                        # Source code
│   ├── components/            # React components
│   ├── pages/                 # Page components
│   ├── services/              # API client and utilities
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript type definitions
│   ├── App.tsx                # Root component
│   └── main.tsx               # Application entry point
├── public/                     # Static assets
├── dist/                       # Build output (gitignored)
├── node_modules/              # Dependencies (gitignored)
├── .husky/                    # Git hooks
├── index.html                 # HTML template
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
├── eslint.config.js           # ESLint configuration
├── .prettierrc                # Prettier configuration
├── package.json               # Dependencies and scripts
└── .env.production            # Production environment variables
```

## Key Architectural Patterns

### Backend

- **Service Layer Pattern**: Business logic separated into service interfaces and implementations
- **Repository Pattern**: Data access abstracted through IDataService
- **Dependency Injection**: All services registered in Program.cs and injected via constructor
- **Configuration-based Setup**: Environment variables override appsettings.json for production
- **Middleware Pipeline**: CORS → Authentication → Authorization → Controllers
- **Database Migrations**: Entity Framework Core migrations run automatically on startup

### Frontend

- **Component-based Architecture**: Reusable React components
- **Type Safety**: Full TypeScript coverage
- **API Client Pattern**: Centralized Axios configuration for API calls
- **Route-based Code Splitting**: React Router for navigation
- **Utility-first CSS**: Tailwind CSS for styling
- **Git Hooks**: Pre-commit linting and type checking via Husky

## Configuration Files

- `.gitignore`: Excludes build outputs, dependencies, and sensitive files
- `.env.deploy`: Deployment credentials (AWS keys, JWT secret, database password)
- `.elasticbeanstalk/config.yml`: Elastic Beanstalk application and environment settings
- `cloudfront-config.json`: CloudFront distribution configuration

## Deployment Artifacts

- `deployment.zip`: Backend deployment package (IIS + .NET app)
- `publish/`: Backend build output before packaging
- `hirethemnow.client/dist/`: Frontend production build

## Testing

- `HireThemNow.Test/`: Integration tests for API endpoints
- Test project references the main server project via `public partial class Program`

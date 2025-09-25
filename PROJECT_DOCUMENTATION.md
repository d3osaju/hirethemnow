# HireThemNow Project Documentation

## Overview

HireThemNow is a full-stack web application built with a modern tech stack featuring:
- **Frontend**: React 19 with TypeScript and Vite
- **Backend**: ASP.NET Core 8.0 Web API
- **Architecture**: SPA (Single Page Application) with API backend

## Project Structure

```
HireThemNow/
├── hirethemnow.client/          # React TypeScript frontend
│   ├── src/
│   │   ├── App.tsx              # Main React component
│   │   ├── main.tsx             # React app entry point
│   │   ├── App.css              # App-specific styles
│   │   ├── index.css            # Global styles
│   │   └── assets/              # Static assets
│   ├── public/                  # Public static files
│   ├── package.json             # Node.js dependencies
│   ├── vite.config.ts          # Vite configuration
│   ├── tsconfig.json           # TypeScript configuration
│   └── eslint.config.js        # ESLint configuration
├── HireThemNoW.Server/          # ASP.NET Core backend
│   ├── Controllers/
│   │   └── WeatherForecastController.cs  # Sample API controller
│   ├── Program.cs               # Application entry point
│   ├── WeatherForecast.cs      # Sample model
│   ├── appsettings.json        # App configuration
│   ├── appsettings.Development.json  # Dev environment config
│   ├── HireThemNoW.Server.csproj     # Project file
│   └── Dockerfile              # Docker configuration
└── HireThemNoW.sln             # Visual Studio solution file
```

## Technology Stack

### Frontend (hirethemnow.client)
- **React**: 19.1.1 - Modern React with latest features
- **TypeScript**: 5.8.3 - Type-safe JavaScript
- **Vite**: 7.1.7 - Fast build tool and dev server
- **ESLint**: 9.36.0 - Code linting and formatting

### Backend (HireThemNoW.Server)
- **ASP.NET Core**: 8.0 - Cross-platform web framework
- **Swagger/OpenAPI**: API documentation and testing
- **Entity Framework Core**: (Ready for database integration)
- **Docker**: Container support included

## Environment Configuration

The project supports multiple deployment environments:

### Development Environment
- Frontend: https://doswhc5mmajby.cloudfront.net
- Backend API: https://fwpbgictmi.execute-api.us-east-1.amazonaws.com/dev

### Production Environment
- Frontend: https://d203avobknjbyh.cloudfront.net
- Backend API: https://ijcm8d71tl.execute-api.us-east-1.amazonaws.com/dev

### Environment Variables
- `DATABASE_PASSWORD`: Set in GitHub Secrets or environment
- `JWT_SECRET`: Set in GitHub Secrets or environment
- `GOOGLE_CLIENT_ID`: Set in GitHub Secrets or environment
- `GOOGLE_CLIENT_SECRET`: Set in GitHub Secrets or environment

**Security Note**: All sensitive values are configured through environment variables and GitHub Secrets, never hardcoded in the repository.

## Development Setup

### Prerequisites
- Node.js (for frontend)
- .NET 8.0 SDK (for backend)
- Docker (optional, for containerization)

### Frontend Setup
```bash
cd hirethemnow.client
npm install
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
```

### Backend Setup
```bash
cd HireThemNoW.Server
dotnet restore
dotnet run           # Start development server
dotnet build         # Build project
```

## Key Features & Architecture

### Current Implementation
- **SPA Integration**: Backend configured to serve React frontend as default files
- **API Structure**: RESTful API with controllers
- **Development Tools**: Hot module replacement (HMR) with Vite
- **Type Safety**: Full TypeScript support on frontend
- **API Documentation**: Swagger UI available in development mode
- **CORS Ready**: Configured for cross-origin requests
- **Docker Support**: Containerization ready

### Sample API Endpoint
- `GET /WeatherForecast` - Returns sample weather data (demo endpoint)

### Frontend Components
- Basic React app with counter functionality
- Modern React 19 features support
- Vite + React logo display
- CSS styling with modern layout

## Configuration Files

### Frontend Configuration
- **vite.config.ts**: Vite build configuration with React plugin
- **tsconfig.json**: TypeScript compiler options
- **eslint.config.js**: Code quality and style rules

### Backend Configuration
- **Program.cs**: Application startup and middleware configuration
- **appsettings.json**: Application settings and logging configuration
- **HireThemNoW.Server.csproj**: Project dependencies and build settings

## Development Workflow

1. **Frontend Development**: Use `npm run dev` for hot reloading
2. **Backend Development**: Use `dotnet run` for API server
3. **Integration Testing**: Both servers can run simultaneously
4. **Production Build**: `npm run build` + `dotnet publish`

## Deployment

The application is configured for AWS deployment:
- Frontend: CloudFront distribution
- Backend: AWS Lambda with API Gateway
- Environment-specific endpoints configured

## Security Considerations

- JWT authentication setup ready
- Google OAuth integration prepared
- Environment-specific configuration
- HTTPS enforcement in production
- Docker security best practices

## Future Development

Based on the current structure, the application appears to be set up for:
- User authentication and authorization
- Database integration
- API expansion beyond weather demo
- Full hiring/recruitment platform features

## Notes

- The project uses the latest React 19 and .NET 8.0
- Docker support is included for containerized deployment
- AWS deployment configuration is already in place
- The naming convention uses both "HireThemNow" and "HireThemNoW" - consider standardizing
- Environment variables include Google OAuth credentials, suggesting social login functionality

This documentation provides a comprehensive overview of the HireThemNow project structure, technology stack, and development setup.
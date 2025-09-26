# Multi-stage build for HireThemNow application
# Stage 1: Build React client
FROM node:18-alpine AS client-build
WORKDIR /app/client

# Copy package files
COPY hirethemnow.client/package*.json ./
RUN npm ci

# Copy client source and build
COPY hirethemnow.client/ ./
# Set environment variable for Docker build to use local API
ENV VITE_API_BASE_URL=http://localhost:8080/api
RUN npm run build

# Stage 2: Build .NET server
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS server-build
WORKDIR /app

# Copy csproj and restore dependencies
COPY HireThemNoW.Server/*.csproj ./HireThemNoW.Server/
RUN dotnet restore ./HireThemNoW.Server/

# Copy server source and build
COPY HireThemNoW.Server/ ./HireThemNoW.Server/
RUN dotnet publish ./HireThemNoW.Server/ -c Release -o out

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copy built server application
COPY --from=server-build /app/out .

# Copy built client files to wwwroot
COPY --from=client-build /app/client/dist ./wwwroot

# Set environment variables
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080

# Expose port
EXPOSE 8080

# Start the application
ENTRYPOINT ["dotnet", "HireThemNoW.Server.dll"]
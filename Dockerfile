# Use the official .NET 8 SDK image for building
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project file and restore dependencies
COPY HireThemNoW.Server/HireThemNoW.Server.csproj HireThemNoW.Server/
RUN dotnet restore HireThemNoW.Server/HireThemNoW.Server.csproj

# Copy the rest of the source code
COPY HireThemNoW.Server/ HireThemNoW.Server/

# Build the application
WORKDIR /src/HireThemNoW.Server
RUN dotnet build -c Release -o /app/build

# Publish the application
RUN dotnet publish -c Release -o /app/publish

# Use the official .NET 8 runtime image for running
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy the published application
COPY --from=build /app/publish .

# Create logs directory
RUN mkdir -p /app/logs

# Expose port
EXPOSE 8080

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Development

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/startup-health || exit 1

# Start the application
ENTRYPOINT ["dotnet", "HireThemNoW.Server.dll"]
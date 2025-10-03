#!/bin/bash
set -e

echo "🗄️ Running database migrations..."

# Apply Entity Framework migrations
dotnet ef database update --no-build --verbose

echo "✅ Migrations complete"
echo "🚀 Starting application..."

# Start the application
exec dotnet HireThemNoW.Server.dll

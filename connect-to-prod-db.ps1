# PowerShell script to set environment variables for connecting to production database
# Run this before starting your local development server

$env:DATABASE_HOST = "hirethemnow-db.ca5kaqqsyk65.us-east-1.rds.amazonaws.com"
$env:DATABASE_NAME = "postgres"
$env:DATABASE_USER = "postgres"
$env:DATABASE_PASSWORD = "hirethem4us"

# Also set other required environment variables for local development
$env:JWT_SECRET = "7907248c76370fc472097c98a09f9296"
$env:GOOGLE_CLIENT_ID = "419725254966-5i7rgg3h7j984od6mi3ib4tt3rqq8o4j.apps.googleusercontent.com"
$env:GOOGLE_CLIENT_SECRET = "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"
$env:AWS_ACCESS_KEY_ID = "AKIATY6KSOHA4ELP7TWZ"
$env:AWS_SECRET_ACCESS_KEY = "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"
$env:AWS_REGION = "us-east-1"

Write-Host "Environment variables set for production database connection"
Write-Host "Database Host: $env:DATABASE_HOST"
Write-Host "Database Name: $env:DATABASE_NAME"
Write-Host "Database User: $env:DATABASE_USER"

# Now run your application
Write-Host "Starting application with production database connection..."
cd HireThemNoW.Server
dotnet run
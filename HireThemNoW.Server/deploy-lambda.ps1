param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "prod",

    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",

    [Parameter(Mandatory=$false)]
    [string]$FunctionName = "hirethemnow-api-$Environment"
)

Write-Host "🚀 Deploying HireThemNow .NET API to AWS Lambda" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "Function Name: $FunctionName" -ForegroundColor Yellow

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI is available" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    exit 1
}

# Check if dotnet lambda tools are installed
try {
    dotnet lambda help | Out-Null
    Write-Host "✅ AWS Lambda Tools for .NET are available" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS Lambda Tools not found. Installing..." -ForegroundColor Yellow
    dotnet tool install -g Amazon.Lambda.Tools
}

# Clean and build the project
Write-Host "🔨 Building the project..." -ForegroundColor Blue
dotnet clean
dotnet build --configuration Release

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor Green

# Package and deploy to Lambda
Write-Host "📦 Packaging and deploying to Lambda..." -ForegroundColor Blue

# Set environment variables for the Lambda function
$env:JWT_SECRET = "ae9d27decc25cb45671ce98206e402e2"
$env:GOOGLE_CLIENT_ID = "419725254966-5i7rgg3h7j984od6mi3ib4tt3rqq8o4j.apps.googleusercontent.com"
$env:GOOGLE_CLIENT_SECRET = "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"

# Deploy using dotnet lambda
dotnet lambda deploy-function `
    --function-name $FunctionName `
    --function-role "" `
    --region $Region `
    --configuration Release `
    --framework net8.0 `
    --function-runtime dotnet8 `
    --function-memory-size 512 `
    --function-timeout 30 `
    --environment-variables "ASPNETCORE_ENVIRONMENT=Production;JWT_SECRET=$env:JWT_SECRET;GOOGLE_CLIENT_ID=$env:GOOGLE_CLIENT_ID;GOOGLE_CLIENT_SECRET=$env:GOOGLE_CLIENT_SECRET"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Lambda function deployed successfully!" -ForegroundColor Green

    # Get the function URL
    Write-Host "📋 Getting function details..." -ForegroundColor Blue
    $functionInfo = aws lambda get-function --function-name $FunctionName --region $Region 2>$null | ConvertFrom-Json

    if ($functionInfo) {
        Write-Host "🔗 Function ARN: $($functionInfo.Configuration.FunctionArn)" -ForegroundColor Cyan
        Write-Host "⚡ Runtime: $($functionInfo.Configuration.Runtime)" -ForegroundColor Cyan
        Write-Host "💾 Memory: $($functionInfo.Configuration.MemorySize) MB" -ForegroundColor Cyan
        Write-Host "⏱️ Timeout: $($functionInfo.Configuration.Timeout) seconds" -ForegroundColor Cyan
    }

    Write-Host ""
    Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
    Write-Host "📝 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Update your API Gateway to point to this Lambda function" -ForegroundColor White
    Write-Host "   2. Update your frontend configuration to use the correct API endpoint" -ForegroundColor White
    Write-Host "   3. Test your API endpoints" -ForegroundColor White
} else {
    Write-Host "❌ Lambda deployment failed" -ForegroundColor Red
    exit 1
}
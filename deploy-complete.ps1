param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "prod",

    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",

    [Parameter(Mandatory=$false)]
    [string]$StackName = "hirethemnow-$Environment",

    [Parameter(Mandatory=$false)]
    [string]$DatabasePassword = "hirethem4us",

    [Parameter(Mandatory=$false)]
    [string]$JWTSecret = "ae9d27decc25cb45671ce98206e402e2",

    [Parameter(Mandatory=$false)]
    [string]$GoogleClientId = "419725254966-5i7rgg3h7j984od6mi3ib4tt3rqq8o4j.apps.googleusercontent.com",

    [Parameter(Mandatory=$false)]
    [string]$GoogleClientSecret = "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"
)

Write-Host "🚀 Complete HireThemNow Deployment to AWS" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "Stack Name: $StackName" -ForegroundColor Yellow

# Step 1: Deploy Infrastructure (CloudFormation)
Write-Host ""
Write-Host "📋 Step 1: Deploying Infrastructure..." -ForegroundColor Blue

Push-Location aws-deployment

aws cloudformation deploy `
    --template-file cloudformation-template.yaml `
    --stack-name $StackName `
    --parameter-overrides `
        Environment=$Environment `
        DatabasePassword=$DatabasePassword `
        JWTSecret=$JWTSecret `
        GoogleClientId=$GoogleClientId `
        GoogleClientSecret=$GoogleClientSecret `
    --capabilities CAPABILITY_IAM `
    --region $Region

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Infrastructure deployment failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "✅ Infrastructure deployed successfully" -ForegroundColor Green

# Get the Lambda function name from CloudFormation outputs
$lambdaFunctionName = "$StackName-api-$Environment"

Pop-Location

# Step 2: Build and Deploy .NET API to Lambda
Write-Host ""
Write-Host "⚙️ Step 2: Building and Deploying .NET API..." -ForegroundColor Blue

Push-Location HireThemNoW.Server

# Build the project
Write-Host "🔨 Building .NET project..." -ForegroundColor Blue
dotnet clean
dotnet build --configuration Release

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ .NET build failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Deploy to the existing Lambda function
Write-Host "📦 Deploying to Lambda function: $lambdaFunctionName" -ForegroundColor Blue

dotnet lambda deploy-function `
    --function-name $lambdaFunctionName `
    --region $Region `
    --configuration Release `
    --framework net8.0 `
    --function-runtime dotnet8 `
    --environment-variables "ASPNETCORE_ENVIRONMENT=Production;JWT_SECRET=$JWTSecret;GOOGLE_CLIENT_ID=$GoogleClientId;GOOGLE_CLIENT_SECRET=$GoogleClientSecret" `
    --function-memory-size 512 `
    --function-timeout 30

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Lambda deployment failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "✅ Lambda function deployed successfully" -ForegroundColor Green

Pop-Location

# Step 3: Build and Deploy Frontend
Write-Host ""
Write-Host "🌐 Step 3: Building and Deploying Frontend..." -ForegroundColor Blue

Push-Location hirethemnow.client

# Get the API Gateway URL from CloudFormation
$apiUrl = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query "Stacks[0].Outputs[?OutputKey=='ApiURL'].OutputValue" `
    --output text

$frontendBucket = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query "Stacks[0].Outputs[?OutputKey=='S3FrontendBucket'].OutputValue" `
    --output text

if ($apiUrl -and $frontendBucket) {
    Write-Host "🔗 API URL: $apiUrl" -ForegroundColor Cyan
    Write-Host "🪣 Frontend Bucket: $frontendBucket" -ForegroundColor Cyan

    # Set environment variable for build
    $env:VITE_API_BASE_URL = $apiUrl

    # Build the frontend
    Write-Host "🔨 Building React frontend..." -ForegroundColor Blue
    npm install
    npm run build:production

    if ($LASTEXITCODE -eq 0) {
        # Deploy to S3
        Write-Host "📤 Uploading to S3..." -ForegroundColor Blue
        aws s3 sync dist/ "s3://$frontendBucket" --delete --region $Region

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Frontend deployed successfully" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Frontend upload failed" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️ Frontend build failed" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ Could not get CloudFormation outputs" -ForegroundColor Yellow
}

Pop-Location

# Step 4: Display Deployment Summary
Write-Host ""
Write-Host "📊 Deployment Summary" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green

$outputs = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query "Stacks[0].Outputs" `
    --output table

Write-Host $outputs

Write-Host ""
Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Test your API endpoints" -ForegroundColor White
Write-Host "   2. Update your frontend configuration if needed" -ForegroundColor White
Write-Host "   3. Configure your domain name (optional)" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Your application should be available at the CloudFront URL shown above." -ForegroundColor Cyan
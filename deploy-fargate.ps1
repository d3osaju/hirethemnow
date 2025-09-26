param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "prod",

    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",

    [Parameter(Mandatory=$false)]
    [string]$StackName = "hirethemnow-fargate-$Environment"
)

Write-Host "🚀 Deploying HireThemNow to AWS Fargate (Cost-Optimized)" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "Stack Name: $StackName" -ForegroundColor Yellow
Write-Host "Expected Monthly Cost: ~$10-15 (vs $50+ with Lambda/RDS)" -ForegroundColor Green

# Step 1: Deploy Infrastructure
Write-Host ""
Write-Host "📋 Step 1: Deploying Infrastructure..." -ForegroundColor Blue

Push-Location aws-deployment

aws cloudformation deploy `
    --template-file fargate-template.yaml `
    --stack-name $StackName `
    --parameter-overrides `
        Environment=$Environment `
        JWTSecret=ae9d27decc25cb45671ce98206e402e2 `
        GoogleClientId=419725254966-5i7rgg3h7j984od6mi3ib4tt3rqq8o4j.apps.googleusercontent.com `
        GoogleClientSecret=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 `
    --capabilities CAPABILITY_IAM `
    --region $Region

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Infrastructure deployment failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "✅ Infrastructure deployed successfully" -ForegroundColor Green

# Get outputs
$ecrRepository = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query "Stacks[0].Outputs[?OutputKey=='ECRRepository'].OutputValue" `
    --output text

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

Pop-Location

Write-Host "🔗 ECR Repository: $ecrRepository" -ForegroundColor Cyan
Write-Host "🔗 API URL: $apiUrl" -ForegroundColor Cyan

# Step 2: Build and Push Docker Image
Write-Host ""
Write-Host "🐳 Step 2: Building and Pushing Docker Image..." -ForegroundColor Blue

# Login to ECR
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $ecrRepository.Split('/')[0]

# Build Docker image
Write-Host "🔨 Building Docker image..." -ForegroundColor Blue
docker build -t hirethemnow-api .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    exit 1
}

# Tag and push image
Write-Host "📤 Pushing to ECR..." -ForegroundColor Blue
docker tag hirethemnow-api:latest $ecrRepository:latest
docker push $ecrRepository:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker push failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker image pushed successfully" -ForegroundColor Green

# Step 3: Update ECS Service
Write-Host ""
Write-Host "🔄 Step 3: Updating ECS Service..." -ForegroundColor Blue

aws ecs update-service `
    --cluster "$StackName-cluster" `
    --service "$StackName-service" `
    --force-new-deployment `
    --region $Region

Write-Host "✅ ECS service updated - new deployment in progress" -ForegroundColor Green

# Step 4: Build and Deploy Frontend
Write-Host ""
Write-Host "🌐 Step 4: Building and Deploying Frontend..." -ForegroundColor Blue

Push-Location hirethemnow.client

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

Pop-Location

# Step 5: Wait for service to be stable
Write-Host ""
Write-Host "⏳ Step 5: Waiting for service to be stable..." -ForegroundColor Blue

aws ecs wait services-stable `
    --cluster "$StackName-cluster" `
    --services "$StackName-service" `
    --region $Region

Write-Host "✅ Service is now stable and running" -ForegroundColor Green

# Step 6: Test the deployment
Write-Host ""
Write-Host "🧪 Step 6: Testing the deployment..." -ForegroundColor Blue

Start-Sleep -Seconds 10
$healthCheck = curl.exe -s "$apiUrl/api/health" 2>$null

if ($healthCheck) {
    Write-Host "✅ Health check passed!" -ForegroundColor Green
    Write-Host "Response: $healthCheck" -ForegroundColor Cyan
} else {
    Write-Host "⚠️ Health check failed - service may still be starting up" -ForegroundColor Yellow
}

# Display Summary
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
Write-Host "💰 Estimated monthly cost: ~$10-15 (80% savings!)" -ForegroundColor Green
Write-Host "📝 What's running:" -ForegroundColor Yellow
Write-Host "   ✅ 1x Fargate task (512 CPU, 1GB RAM)" -ForegroundColor White
Write-Host "   ✅ Application Load Balancer" -ForegroundColor White
Write-Host "   ✅ CloudFront + S3 for frontend" -ForegroundColor White
Write-Host "   ✅ No RDS, No NAT Gateway, No Lambda" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Your application is available at:" -ForegroundColor Cyan
Write-Host "Frontend: $(aws cloudformation describe-stacks --stack-name $StackName --region $Region --query "Stacks[0].Outputs[?OutputKey=='FrontendURL'].OutputValue" --output text)" -ForegroundColor Cyan
Write-Host "API: $apiUrl" -ForegroundColor Cyan
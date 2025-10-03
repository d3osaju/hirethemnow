# Deploy Lambda Function
# This script packages and deploys the resume processor Lambda function

$ErrorActionPreference = "Stop"

# Configuration
$FunctionName = "hirethemnow-ai-agent-ResumeProcessor"
$Region = "us-east-1"
$ZipFile = "resume-processor.zip"

Write-Host "Starting Lambda deployment..." -ForegroundColor Green

# Step 1: Install dependencies
Write-Host "`n[1/4] Installing dependencies..." -ForegroundColor Yellow
npm ci --production --omit=dev
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Step 2: Create deployment package
Write-Host "`n[2/4] Creating deployment package..." -ForegroundColor Yellow
if (Test-Path $ZipFile) {
    Remove-Item $ZipFile -Force
}

# Create zip excluding dev dependencies and unnecessary files
Add-Type -A 'System.IO.Compression.FileSystem'
$Source = Get-Location
$Destination = Join-Path $Source $ZipFile

# Create temp directory for clean packaging
$TempDir = Join-Path $env:TEMP "lambda-package-$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null

try {
    # Copy only necessary files
    Write-Host "Copying files to temp directory..." -ForegroundColor Gray
    Copy-Item -Path "index.js" -Destination $TempDir
    Copy-Item -Path "package.json" -Destination $TempDir
    Copy-Item -Path "package-lock.json" -Destination $TempDir
    Copy-Item -Path "node_modules" -Destination $TempDir -Recurse

    # Create zip from temp directory
    Write-Host "Creating zip archive..." -ForegroundColor Gray
    [IO.Compression.ZipFile]::CreateFromDirectory($TempDir, $Destination, [IO.Compression.CompressionLevel]::Optimal, $false)

    $ZipSize = (Get-Item $Destination).Length / 1MB
    Write-Host "Package created: $([math]::Round($ZipSize, 2)) MB" -ForegroundColor Green
}
finally {
    # Cleanup temp directory
    if (Test-Path $TempDir) {
        Remove-Item $TempDir -Recurse -Force
    }
}

# Step 3: Deploy to Lambda
Write-Host "`n[3/4] Deploying to AWS Lambda..." -ForegroundColor Yellow
Write-Host "Function: $FunctionName" -ForegroundColor Gray
Write-Host "Region: $Region" -ForegroundColor Gray

aws lambda update-function-code `
    --function-name $FunctionName `
    --zip-file "fileb://$ZipFile" `
    --region $Region `
    --query '{FunctionName:FunctionName,LastModified:LastModified,CodeSize:CodeSize}' `
    --output json

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nDeployment failed!" -ForegroundColor Red
    exit 1
}

# Step 4: Wait for Lambda to be ready
Write-Host "`n[4/4] Waiting for Lambda to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$Status = aws lambda get-function-configuration `
    --function-name $FunctionName `
    --region $Region `
    --query 'LastUpdateStatus' `
    --output text

Write-Host "Status: $Status" -ForegroundColor $(if ($Status -eq "Successful") { "Green" } else { "Yellow" })

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "`nNext step: Upload a resume to test the fix" -ForegroundColor Cyan

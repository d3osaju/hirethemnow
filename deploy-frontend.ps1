# AWS S3 + CloudFront Frontend Deployment Script
# Deploys React frontend to S3 with CloudFront CDN

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AWS Frontend Deployment (S3 + CloudFront)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Load environment variables from .env.deploy (optional for frontend, but good for consistency)
if (Test-Path .env.deploy) {
    Write-Host "`nLoading environment variables from .env.deploy..." -ForegroundColor Yellow
    Get-Content .env.deploy | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Configuration
$BUCKET_NAME = "hirethemnow-frontend"
$REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "us-east-1" }
$FRONTEND_PATH = "hirethemnow.client"

Write-Host "`nStep 1: Building React frontend..." -ForegroundColor Yellow
cd $FRONTEND_PATH
npm install
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend build failed!" -ForegroundColor Red
    exit 1
}

cd ..

Write-Host "`nStep 2: Checking if S3 bucket exists..." -ForegroundColor Yellow
$bucketExists = aws s3 ls "s3://$BUCKET_NAME" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating S3 bucket..." -ForegroundColor Yellow
    aws s3 mb "s3://$BUCKET_NAME" --region $REGION
} else {
    Write-Host "Bucket already exists, updating configuration..." -ForegroundColor Yellow
}

# Configure bucket for static website hosting
Write-Host "Configuring static website hosting..." -ForegroundColor Yellow
aws s3 website "s3://$BUCKET_NAME" --index-document index.html --error-document index.html

# Disable block public access
Write-Host "Disabling public access blocks..." -ForegroundColor Yellow
aws s3api put-public-access-block --bucket $BUCKET_NAME --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" --region $REGION

# Set bucket policy for public read access
Write-Host "Setting public read policy..." -ForegroundColor Yellow
$policy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
"@

$policy | Out-File -FilePath bucket-policy.json -Encoding utf8
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json --region $REGION 2>$null
Remove-Item bucket-policy.json -ErrorAction SilentlyContinue

Write-Host "`nStep 3: Uploading frontend to S3..." -ForegroundColor Yellow
aws s3 sync "$FRONTEND_PATH/dist" "s3://$BUCKET_NAME" --delete

# Step 4: Invalidate CloudFront cache (if CloudFront distribution exists)
Write-Host "`nStep 4: Checking for CloudFront distribution..." -ForegroundColor Yellow
$distributionId = aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items[?contains(@, 'hirethemnow.xyz')]].Id" --output text 2>$null

if ($distributionId -and $distributionId -ne "") {
    Write-Host "Found CloudFront distribution: $distributionId" -ForegroundColor Yellow
    Write-Host "Invalidating CloudFront cache..." -ForegroundColor Yellow

    $invalidation = aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*" 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "CloudFront cache invalidation initiated successfully!" -ForegroundColor Green
        Write-Host "Cache will be cleared in 2-5 minutes" -ForegroundColor Cyan
    } else {
        Write-Host "Warning: CloudFront invalidation failed, but deployment was successful" -ForegroundColor Yellow
        Write-Host "You may need to wait for cache to expire or invalidate manually" -ForegroundColor Yellow
    }
} else {
    Write-Host "No CloudFront distribution found - skipping cache invalidation" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Frontend Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nYour frontend is available at:" -ForegroundColor Cyan
Write-Host "https://www.hirethemnow.xyz" -ForegroundColor White
Write-Host "http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com" -ForegroundColor Gray

if ($distributionId -and $distributionId -ne "") {
    Write-Host "`nCloudFront cache invalidated - wait 2-5 minutes for changes to appear" -ForegroundColor Cyan
    Write-Host "Then do a hard refresh (Ctrl+Shift+R) in your browser" -ForegroundColor Cyan
}

# Deployment Verification Script
# Checks if frontend and backend deployments are live

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$REGION = $env:AWS_REGION
if (-not $REGION) {
    $REGION = "us-east-1"
}

# Check Frontend (S3 + CloudFront)
Write-Host "`n1. Checking Frontend Deployment..." -ForegroundColor Yellow

# Get CloudFront distribution
$DISTRIBUTION_ID = aws cloudfront list-distributions --query "DistributionList.Items[?contains(Aliases.Items, 'hirethemnow.xyz')].Id" --output text 2>$null

if ($DISTRIBUTION_ID) {
    Write-Host "   CloudFront Distribution: $DISTRIBUTION_ID" -ForegroundColor Green
    
    # Check last invalidation
    $lastInvalidation = aws cloudfront list-invalidations --distribution-id $DISTRIBUTION_ID --query "InvalidationList.Items[0].[Id,Status,CreateTime]" --output text 2>$null
    if ($lastInvalidation) {
        Write-Host "   Last Cache Invalidation: $lastInvalidation" -ForegroundColor Cyan
    } else {
        Write-Host "   No recent cache invalidations found" -ForegroundColor Yellow
        Write-Host "   TIP: Run cache invalidation to clear old content" -ForegroundColor Yellow
    }
} else {
    Write-Host "   WARNING: CloudFront distribution not found" -ForegroundColor Red
}

# Check S3 bucket
Write-Host "`n   Checking S3 bucket..." -ForegroundColor Yellow
$s3Files = aws s3 ls s3://hirethemnow-frontend/ --recursive --human-readable 2>$null | Select-Object -Last 5

if ($s3Files) {
    Write-Host "   Latest files in S3:" -ForegroundColor Green
    $s3Files | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host "   WARNING: Could not list S3 files" -ForegroundColor Red
}

# Check Backend (Elastic Beanstalk)
Write-Host "`n2. Checking Backend Deployment..." -ForegroundColor Yellow

$envStatus = aws elasticbeanstalk describe-environments --environment-names hirethemnow-prod --region $REGION --query "Environments[0].[Status,Health,VersionLabel,DateUpdated]" --output text 2>$null

if ($envStatus) {
    $statusParts = $envStatus -split "`t"
    Write-Host "   Environment Status: $($statusParts[0])" -ForegroundColor $(if ($statusParts[0] -eq "Ready") { "Green" } else { "Yellow" })
    Write-Host "   Health: $($statusParts[1])" -ForegroundColor $(if ($statusParts[1] -eq "Green") { "Green" } elseif ($statusParts[1] -eq "Yellow") { "Yellow" } else { "Red" })
    Write-Host "   Version: $($statusParts[2])" -ForegroundColor Cyan
    Write-Host "   Last Updated: $($statusParts[3])" -ForegroundColor Gray
} else {
    Write-Host "   WARNING: Could not get environment status" -ForegroundColor Red
}

# Check if background service is running
Write-Host "`n3. Checking Resume Parsing Service..." -ForegroundColor Yellow
Write-Host "   Checking application logs for background service..." -ForegroundColor Gray

# Note: This requires the environment to be accessible
Write-Host "   TIP: Check CloudWatch logs for 'Resume parsing background service' messages" -ForegroundColor Cyan

# Test API endpoint
Write-Host "`n4. Testing API Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://api.hirethemnow.xyz/api/resume/status" -Method GET -UseBasicParsing -TimeoutSec 5 2>$null
    if ($response.StatusCode -eq 401) {
        Write-Host "   API is responding (401 Unauthorized - expected without token)" -ForegroundColor Green
    } elseif ($response.StatusCode -eq 200) {
        Write-Host "   API is responding (200 OK)" -ForegroundColor Green
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   API is responding (401 Unauthorized - expected without token)" -ForegroundColor Green
    } else {
        Write-Host "   WARNING: API not responding or error occurred" -ForegroundColor Yellow
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
}

# Test Frontend
Write-Host "`n5. Testing Frontend..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri "https://hirethemnow.xyz" -Method GET -UseBasicParsing -TimeoutSec 5 2>$null
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "   Frontend is responding (200 OK)" -ForegroundColor Green
        
        # Check if it's the new version by looking for specific content
        if ($frontendResponse.Content -match "index-[a-zA-Z0-9]+\.js") {
            $matches[0] -match "index-([a-zA-Z0-9]+)\.js"
            $jsHash = $matches[1]
            Write-Host "   JavaScript bundle hash: $jsHash" -ForegroundColor Cyan
            Write-Host "   TIP: Compare this hash with your local build to verify version" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "   WARNING: Frontend not responding or error occurred" -ForegroundColor Yellow
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Verification Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. If CloudFront cache is old, run:" -ForegroundColor White
Write-Host "   aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths `"/*`"" -ForegroundColor Gray
Write-Host "`n2. Hard refresh your browser:" -ForegroundColor White
Write-Host "   Windows: Ctrl + Shift + R" -ForegroundColor Gray
Write-Host "   Mac: Cmd + Shift + R" -ForegroundColor Gray
Write-Host "`n3. Check browser DevTools (F12) → Network tab" -ForegroundColor White
Write-Host "   Look for 200 status (not 304 cached)" -ForegroundColor Gray
Write-Host "`n4. Try incognito/private window to bypass browser cache" -ForegroundColor White

Write-Host "`nURLs to test:" -ForegroundColor Yellow
Write-Host "   Frontend: https://hirethemnow.xyz" -ForegroundColor Cyan
Write-Host "   API: https://api.hirethemnow.xyz" -ForegroundColor Cyan
Write-Host "   Parsed Resume: https://hirethemnow.xyz/dashboard/parsed-resume" -ForegroundColor Cyan

# Vercel Frontend Deployment Script
# Deploys React frontend to Vercel

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Vercel Frontend Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Navigate to client directory
$FRONTEND_PATH = "hirethemnow.client"

Write-Host "`nStep 1: Building React frontend locally..." -ForegroundColor Yellow
Set-Location $FRONTEND_PATH
npm install
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "`nStep 2: Deploying to Vercel..." -ForegroundColor Yellow
vercel --prod

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Vercel deployment failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Vercel Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nYour frontend is now live on Vercel!" -ForegroundColor Cyan
Write-Host "Check the deployment URL above for the live site." -ForegroundColor Cyan
Write-Host "`nTo set up a custom domain:" -ForegroundColor Yellow
Write-Host "1. Go to https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. Select your project (hirethemnowv1)" -ForegroundColor White
Write-Host "3. Go to Settings > Domains" -ForegroundColor White
Write-Host "4. Add your custom domain (hirethemnow.xyz)" -ForegroundColor White
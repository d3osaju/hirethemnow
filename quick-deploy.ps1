# HireThemNow Quick Deploy Script (PowerShell)
# Runs all checks, creates smart commit, and pushes to GitHub

param(
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 HireThemNow Quick Deploy Starting..." -ForegroundColor Green

# Navigate to project root
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

Write-Host "📁 Working directory: $(Get-Location)" -ForegroundColor Blue

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    exit 1
}

# Check for uncommitted changes
$gitStatus = git status --porcelain
if (-not $gitStatus) {
    Write-Host "✅ No changes to commit" -ForegroundColor Green
    exit 0
}

Write-Host "🔍 Running frontend checks..." -ForegroundColor Yellow

# Navigate to client directory
Set-Location "hirethemnow.client"

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
    npm ci
}

# Run ESLint
Write-Host "🔧 Running ESLint..." -ForegroundColor Blue
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ESLint failed" -ForegroundColor Red
    exit 1
}

# Run TypeScript check
Write-Host "🔍 Running TypeScript check..." -ForegroundColor Blue
npm run type-check
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TypeScript check failed" -ForegroundColor Red
    exit 1
}

# Build project to ensure it compiles
Write-Host "🏗️ Building project..." -ForegroundColor Blue
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend checks passed!" -ForegroundColor Green

# Navigate back to project root
Set-Location $ProjectRoot

Write-Host "🔍 Running backend checks..." -ForegroundColor Yellow

# Navigate to server directory
Set-Location "HireThemNoW.Server"

# Restore dependencies
Write-Host "📦 Restoring .NET dependencies..." -ForegroundColor Blue
dotnet restore
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ .NET restore failed" -ForegroundColor Red
    exit 1
}

# Build backend
Write-Host "🏗️ Building backend..." -ForegroundColor Blue
dotnet build --configuration Release --no-restore
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ .NET build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend checks passed!" -ForegroundColor Green

# Navigate back to project root
Set-Location $ProjectRoot

Write-Host "📝 Creating commit..." -ForegroundColor Yellow

# Stage all changes
git add .

# Check if there are staged changes
$stagedChanges = git diff --staged --name-only
if (-not $stagedChanges) {
    Write-Host "✅ No changes to commit after staging" -ForegroundColor Green
    exit 0
}

# Generate commit message based on changes if not provided
if (-not $Message) {
    $frontendChanges = ($stagedChanges | Where-Object { $_ -match "hirethemnow\.client/" }).Count
    $backendChanges = ($stagedChanges | Where-Object { $_ -match "HireThemNoW\.Server/" }).Count
    $configChanges = ($stagedChanges | Where-Object { $_ -match "\.(md|yml|yaml|json|ps1|sh)$" }).Count

    # Determine commit type and scope
    if ($frontendChanges -gt 0 -and $backendChanges -gt 0) {
        $commitType = "feat"
        $scope = "full-stack"
    }
    elseif ($frontendChanges -gt 0) {
        $commitType = "feat"
        $scope = "frontend"
    }
    elseif ($backendChanges -gt 0) {
        $commitType = "feat"
        $scope = "backend"
    }
    elseif ($configChanges -gt 0) {
        $commitType = "chore"
        $scope = "config"
    }
    else {
        $commitType = "chore"
        $scope = "misc"
    }

    # Determine description based on file types
    $description = "Update codebase"

    if ($stagedChanges -match "\.tsx?$") {
        if ($stagedChanges -match "component") {
            $description = "Update React components"
        }
        elseif ($stagedChanges -match "page") {
            $description = "Update page components"
        }
        else {
            $description = "Update frontend code"
        }
    }
    elseif ($stagedChanges -match "\.cs$") {
        if ($stagedChanges -match "Controller") {
            $description = "Update API controllers"
        }
        elseif ($stagedChanges -match "Service") {
            $description = "Update services"
        }
        elseif ($stagedChanges -match "Model") {
            $description = "Update data models"
        }
        else {
            $description = "Update backend code"
        }
    }
    elseif ($stagedChanges -match "\.md$") {
        $description = "Update documentation"
        $commitType = "docs"
    }
    elseif ($stagedChanges -match "package\.json|\.yml|\.yaml|\.ps1|\.sh") {
        $description = "Update configuration"
        $commitType = "chore"
    }

    $Message = @"
$commitType($scope): $description

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
"@
}

Write-Host "📝 Commit message:" -ForegroundColor Blue
Write-Host $Message -ForegroundColor Gray
Write-Host ""

# Create the commit
git commit -m $Message
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Commit failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Commit created successfully!" -ForegroundColor Green

# Push to GitHub
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
git push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
Write-Host "🎉 Quick deploy completed!" -ForegroundColor Magenta

# Show final status
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Blue
$frontendCount = ($stagedChanges | Where-Object { $_ -match "hirethemnow\.client/" }).Count
$backendCount = ($stagedChanges | Where-Object { $_ -match "HireThemNoW\.Server/" }).Count
$configCount = ($stagedChanges | Where-Object { $_ -match "\.(md|yml|yaml|json|ps1|sh)$" }).Count

Write-Host "  - Frontend files changed: $frontendCount" -ForegroundColor Gray
Write-Host "  - Backend files changed: $backendCount" -ForegroundColor Gray
Write-Host "  - Config files changed: $configCount" -ForegroundColor Gray
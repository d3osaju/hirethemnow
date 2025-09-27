#!/bin/bash

# HireThemNow Quick Deploy Script
# Runs all checks, creates smart commit, and pushes to GitHub

set -e  # Exit on any error

echo "🚀 HireThemNow Quick Deploy Starting..."

# Navigate to project root
cd "$(dirname "$0")"

echo "📁 Working directory: $(pwd)"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check for uncommitted changes
if git diff --quiet && git diff --staged --quiet; then
    echo "✅ No changes to commit"
    exit 0
fi

echo "🔍 Running frontend checks..."

# Navigate to client directory
cd hirethemnow.client

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci
fi

# Run ESLint
echo "🔧 Running ESLint..."
npm run lint

# Run TypeScript check
echo "🔍 Running TypeScript check..."
npm run type-check

# Build project to ensure it compiles
echo "🏗️ Building project..."
npm run build

echo "✅ Frontend checks passed!"

# Navigate back to project root
cd ..

echo "🔍 Running backend checks..."

# Navigate to server directory
cd HireThemNoW.Server

# Restore dependencies
echo "📦 Restoring .NET dependencies..."
dotnet restore

# Build backend
echo "🏗️ Building backend..."
dotnet build --configuration Release --no-restore

echo "✅ Backend checks passed!"

# Navigate back to project root
cd ..

echo "📝 Creating commit..."

# Stage all changes
git add .

# Check if there are staged changes
if git diff --staged --quiet; then
    echo "✅ No changes to commit after staging"
    exit 0
fi

# Generate commit message based on changes
CHANGED_FILES=$(git diff --staged --name-only)
FRONTEND_CHANGES=$(echo "$CHANGED_FILES" | grep -E "hirethemnow\.client/" | wc -l)
BACKEND_CHANGES=$(echo "$CHANGED_FILES" | grep -E "HireThemNoW\.Server/" | wc -l)
CONFIG_CHANGES=$(echo "$CHANGED_FILES" | grep -E "\.(md|yml|yaml|json|sh)$" | wc -l)

# Determine commit type and scope
if [ "$FRONTEND_CHANGES" -gt 0 ] && [ "$BACKEND_CHANGES" -gt 0 ]; then
    COMMIT_TYPE="feat"
    SCOPE="full-stack"
elif [ "$FRONTEND_CHANGES" -gt 0 ]; then
    COMMIT_TYPE="feat"
    SCOPE="frontend"
elif [ "$BACKEND_CHANGES" -gt 0 ]; then
    COMMIT_TYPE="feat"
    SCOPE="backend"
elif [ "$CONFIG_CHANGES" -gt 0 ]; then
    COMMIT_TYPE="chore"
    SCOPE="config"
else
    COMMIT_TYPE="chore"
    SCOPE="misc"
fi

# Check for specific file types to determine better commit messages
if echo "$CHANGED_FILES" | grep -q "\.tsx\?$"; then
    if echo "$CHANGED_FILES" | grep -q "component"; then
        DESCRIPTION="Update React components"
    elif echo "$CHANGED_FILES" | grep -q "page"; then
        DESCRIPTION="Update page components"
    else
        DESCRIPTION="Update frontend code"
    fi
elif echo "$CHANGED_FILES" | grep -q "\.cs$"; then
    if echo "$CHANGED_FILES" | grep -q "Controller"; then
        DESCRIPTION="Update API controllers"
    elif echo "$CHANGED_FILES" | grep -q "Service"; then
        DESCRIPTION="Update services"
    elif echo "$CHANGED_FILES" | grep -q "Model"; then
        DESCRIPTION="Update data models"
    else
        DESCRIPTION="Update backend code"
    fi
elif echo "$CHANGED_FILES" | grep -q "\.md$"; then
    DESCRIPTION="Update documentation"
    COMMIT_TYPE="docs"
elif echo "$CHANGED_FILES" | grep -q "package\.json\|\.yml\|\.yaml"; then
    DESCRIPTION="Update configuration"
    COMMIT_TYPE="chore"
else
    # Analyze git diff for more context
    if git diff --staged | grep -q "import\|export"; then
        DESCRIPTION="Refactor imports and exports"
        COMMIT_TYPE="refactor"
    elif git diff --staged | grep -q "function\|const.*="; then
        DESCRIPTION="Add new functionality"
    elif git diff --staged | grep -q "fix\|bug\|error"; then
        DESCRIPTION="Fix bugs and errors"
        COMMIT_TYPE="fix"
    else
        DESCRIPTION="Improve codebase"
    fi
fi

# Create the commit message
COMMIT_MSG="${COMMIT_TYPE}(${SCOPE}): ${DESCRIPTION}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo "📝 Commit message:"
echo "$COMMIT_MSG"
echo ""

# Create the commit
git commit -m "$COMMIT_MSG"

echo "✅ Commit created successfully!"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push

echo "✅ Successfully pushed to GitHub!"
echo "🎉 Quick deploy completed!"

# Show final status
echo ""
echo "📊 Summary:"
echo "  - Frontend files changed: $FRONTEND_CHANGES"
echo "  - Backend files changed: $BACKEND_CHANGES"
echo "  - Config files changed: $CONFIG_CHANGES"
echo "  - Commit type: $COMMIT_TYPE($SCOPE)"
echo "  - Description: $DESCRIPTION"
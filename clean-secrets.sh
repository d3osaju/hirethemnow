#!/bin/bash

echo "🧹 Cleaning secrets from Git history..."

# The specific secrets to remove
GOOGLE_CLIENT_ID="419725254966-5i7rgg3h7j984od6mi3ib4tt3rqq8o4j.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"
JWT_SECRET="lyFiSiKBumNZ2DnD6bp+yc1ZOrIlBqw+9qP0omM+"
DATABASE_PASSWORD="hirethem4us"

echo "Creating backup branch..."
git branch backup-before-cleanup

echo "Filtering Git history to remove secrets..."

# Use git filter-branch to rewrite history and remove secrets
git filter-branch --force --env-filter '
    export FILTER_BRANCH_SQUELCH_WARNING=1
' --tree-filter '
    # Remove secrets from all files
    find . -type f \( -name "*.md" -o -name "*.yaml" -o -name "*.yml" -o -name "*.json" -o -name "*.ts" -o -name "*.js" \) -exec sed -i.bak \
        -e "s/419725254966-5i7rgg3h7j984od6mi3ib4tt3rqq8o4j.apps.googleusercontent.com/\${GOOGLE_CLIENT_ID}/g" \
        -e "s/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/\${GOOGLE_CLIENT_SECRET}/g" \
        -e "s/lyFiSiKBumNZ2DnD6bp+yc1ZOrIlBqw+9qP0omM+/\${JWT_SECRET}/g" \
        -e "s/hirethem4us/\${DATABASE_PASSWORD}/g" {} \;
    # Remove backup files created by sed
    find . -name "*.bak" -delete
' --tag-name-filter cat -- --all

echo "Cleaning up Git references..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "✅ Git history cleaned!"
echo "⚠️  IMPORTANT: You MUST force push to overwrite remote history:"
echo "   git push origin main --force"
echo ""
echo "🔄 To restore if something goes wrong:"
echo "   git checkout backup-before-cleanup"
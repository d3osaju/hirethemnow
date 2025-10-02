#!/bin/bash

# Generate Release Note Script
# Analyzes git commits and creates a migration to insert release note into database

set -e

# Navigate to project root (in case script is called from elsewhere)
cd "$(dirname "$0")/.."

echo "📝 Generating Release Note..."

# Get the last release note version (if any)
LAST_VERSION=$(git tag --sort=-v:refname | head -n 1)
if [ -z "$LAST_VERSION" ]; then
    # No tags, check commits since beginning
    COMMITS_SINCE="--all"
    NEW_VERSION="1.0.0"
else
    COMMITS_SINCE="${LAST_VERSION}..HEAD"
    # Increment version (simple patch increment)
    IFS='.' read -ra VERSION_PARTS <<< "${LAST_VERSION#v}"
    MAJOR="${VERSION_PARTS[0]}"
    MINOR="${VERSION_PARTS[1]}"
    PATCH="${VERSION_PARTS[2]}"
    PATCH=$((PATCH + 1))
    NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"
fi

echo "📊 Last version: ${LAST_VERSION:-none}"
echo "📦 New version: ${NEW_VERSION}"

# Get commits since last version
COMMITS=$(git log ${COMMITS_SINCE} --oneline --no-merges 2>/dev/null || echo "")

if [ -z "$COMMITS" ]; then
    echo "✅ No new commits since last release"
    exit 0
fi

echo "📋 Commits to analyze:"
echo "$COMMITS"
echo ""

# Categorize commits
declare -a FEATURES=()
declare -a FIXES=()
declare -a IMPROVEMENTS=()

while IFS= read -r commit; do
    # Extract commit message (remove hash)
    MESSAGE=$(echo "$commit" | sed 's/^[a-f0-9]* //')

    # Categorize based on conventional commits
    if echo "$MESSAGE" | grep -qi "^feat"; then
        # Extract feature description
        FEATURE=$(echo "$MESSAGE" | sed 's/^feat[^:]*: *//' | sed 's/🤖.*//' | tr -d '\n')
        if [ ! -z "$FEATURE" ]; then
            FEATURES+=("$FEATURE")
        fi
    elif echo "$MESSAGE" | grep -qi "^fix"; then
        # Extract fix description
        FIX=$(echo "$MESSAGE" | sed 's/^fix[^:]*: *//' | sed 's/🤖.*//' | tr -d '\n')
        if [ ! -z "$FIX" ]; then
            FIXES+=("$FIX")
        fi
    elif echo "$MESSAGE" | grep -qi "^refactor\|^perf\|^improve"; then
        # Extract improvement description
        IMPROVEMENT=$(echo "$MESSAGE" | sed 's/^[^:]*: *//' | sed 's/🤖.*//' | tr -d '\n')
        if [ ! -z "$IMPROVEMENT" ]; then
            IMPROVEMENTS+=("$IMPROVEMENT")
        fi
    fi
done <<< "$COMMITS"

# Build features array for JSON
FEATURES_JSON=""
for feature in "${FEATURES[@]}"; do
    # Escape quotes and format as JSON string
    ESCAPED_FEATURE=$(echo "$feature" | sed 's/"/\\"/g' | sed "s/'/\\\\'/g")
    if [ -z "$FEATURES_JSON" ]; then
        FEATURES_JSON="\"$ESCAPED_FEATURE\""
    else
        FEATURES_JSON="${FEATURES_JSON}, \"$ESCAPED_FEATURE\""
    fi
done

for fix in "${FIXES[@]}"; do
    ESCAPED_FIX=$(echo "Fix: $fix" | sed 's/"/\\"/g' | sed "s/'/\\\\'/g")
    if [ -z "$FEATURES_JSON" ]; then
        FEATURES_JSON="\"$ESCAPED_FIX\""
    else
        FEATURES_JSON="${FEATURES_JSON}, \"$ESCAPED_FIX\""
    fi
done

for improvement in "${IMPROVEMENTS[@]}"; do
    ESCAPED_IMP=$(echo "$improvement" | sed 's/"/\\"/g' | sed "s/'/\\\\'/g")
    if [ -z "$FEATURES_JSON" ]; then
        FEATURES_JSON="\"$ESCAPED_IMP\""
    else
        FEATURES_JSON="${FEATURES_JSON}, \"$ESCAPED_IMP\""
    fi
done

if [ -z "$FEATURES_JSON" ]; then
    echo "⚠️  No categorized changes found"
    exit 0
fi

# Get today's date
RELEASE_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "🎉 Release Note Summary:"
echo "  Version: ${NEW_VERSION}"
echo "  Features: ${#FEATURES[@]}"
echo "  Fixes: ${#FIXES[@]}"
echo "  Improvements: ${#IMPROVEMENTS[@]}"
echo ""

# Create C# migration file
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
MIGRATION_NAME="AddReleaseNote_${NEW_VERSION//./_}"
MIGRATION_FILE="HireThemNoW.Server/Migrations/${TIMESTAMP}_${MIGRATION_NAME}.cs"

# Escape single quotes for C# string
ESCAPED_FEATURES_JSON=$(echo "${FEATURES_JSON}" | sed "s/'/\\\\\\\'/g")

cat > "$MIGRATION_FILE" << 'MIGRATION_EOF'
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HireThemNoW.Server.Migrations
{
    /// <inheritdoc />
    public partial class MIGRATION_CLASS_NAME : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                INSERT INTO ""ReleaseNotes"" (""Version"", ""ReleaseDate"", ""Features"", ""IsPublished"", ""CreatedAt"")
                VALUES (
                    'VERSION_PLACEHOLDER',
                    'RELEASE_DATE_PLACEHOLDER'::timestamp with time zone,
                    '[FEATURES_PLACEHOLDER]'::jsonb,
                    true,
                    'RELEASE_DATE_PLACEHOLDER'::timestamp with time zone
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DELETE FROM ""ReleaseNotes"" WHERE ""Version"" = 'VERSION_PLACEHOLDER';
            ");
        }
    }
}
MIGRATION_EOF

# Replace placeholders
sed -i "s/MIGRATION_CLASS_NAME/${MIGRATION_NAME}/g" "$MIGRATION_FILE"
sed -i "s/VERSION_PLACEHOLDER/${NEW_VERSION}/g" "$MIGRATION_FILE"
sed -i "s/RELEASE_DATE_PLACEHOLDER/${RELEASE_DATE}/g" "$MIGRATION_FILE"
sed -i "s/FEATURES_PLACEHOLDER/${ESCAPED_FEATURES_JSON}/g" "$MIGRATION_FILE"

echo "✅ C# Migration created: ${MIGRATION_FILE}"

# Export for use in quick-deploy.sh
echo "export RELEASE_VERSION=${NEW_VERSION}" > .release-note-env
echo "export RELEASE_MIGRATION=${MIGRATION_FILE}" >> .release-note-env

echo "📄 Release note migration saved"
echo ""
echo "ℹ️  Migration will be automatically applied during deployment"

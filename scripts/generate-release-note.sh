#!/bin/bash

# Generate Release Note Script
# Reads from release-notes.json and creates a migration to insert release note into database

set -e

# Navigate to project root (in case script is called from elsewhere)
cd "$(dirname "$0")/.."

echo "📝 Generating Release Note..."

# Check if release-notes.json exists
if [ ! -f "release-notes.json" ]; then
    echo "❌ Error: release-notes.json not found"
    echo "Please create release-notes.json with your release information"
    exit 1
fi

# Read version and features from release-notes.json
NEW_VERSION=$(grep -o '"version": *"[^"]*"' release-notes.json | head -1 | sed 's/.*: *"\(.*\)"/\1/')
RELEASE_DATE_FROM_FILE=$(grep -o '"releaseDate": *"[^"]*"' release-notes.json | head -1 | sed 's/.*: *"\(.*\)"/\1/')

if [ -z "$NEW_VERSION" ]; then
    echo "❌ Error: Could not read version from release-notes.json"
    exit 1
fi

echo "📦 Version from release-notes.json: ${NEW_VERSION}"

# Extract features array from JSON and build features list
FEATURES_JSON=""
IN_FEATURES=false

while IFS= read -r line; do
    # Check if we're entering the features array
    if echo "$line" | grep -q '"features".*\['; then
        IN_FEATURES=true
        continue
    fi

    # Check if we're exiting the features array
    if [ "$IN_FEATURES" = true ] && echo "$line" | grep -q '^\s*\]'; then
        break
    fi

    # Extract description from feature object
    if [ "$IN_FEATURES" = true ]; then
        DESCRIPTION=$(echo "$line" | grep -o '"description": *"[^"]*"' | sed 's/.*: *"\(.*\)"/\1/')
        if [ ! -z "$DESCRIPTION" ]; then
            # Escape quotes for JSON
            ESCAPED_DESC=$(echo "$DESCRIPTION" | sed 's/"/\\"/g' | sed "s/'/\\\\'/g")
            if [ -z "$FEATURES_JSON" ]; then
                FEATURES_JSON="\"$ESCAPED_DESC\""
            else
                FEATURES_JSON="${FEATURES_JSON}, \"$ESCAPED_DESC\""
            fi
        fi
    fi
done < release-notes.json

if [ -z "$FEATURES_JSON" ]; then
    echo "⚠️  No features found in release-notes.json"
    exit 0
fi

# Count features
FEATURE_COUNT=$(echo "$FEATURES_JSON" | grep -o '", "' | wc -l)
FEATURE_COUNT=$((FEATURE_COUNT + 1))

echo "🎉 Release Note Summary:"
echo "  Version: ${NEW_VERSION}"
echo "  Features: ${FEATURE_COUNT}"
echo ""

# Get today's date
RELEASE_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "🎉 Release Note Summary:"
echo "  Version: ${NEW_VERSION}"
echo "  Features: ${#FEATURES[@]}"
echo "  Fixes: ${#FIXES[@]}"
echo "  Improvements: ${#IMPROVEMENTS[@]}"
echo ""

# Create temporary SQL file for the migration content
MIGRATION_NAME="AddReleaseNote_${NEW_VERSION//./_}"

# Create EF migration using dotnet ef
echo "🔧 Creating Entity Framework migration..."
cd HireThemNoW.Server

# Set required environment variables for EF tools
export JWT_SECRET="temp-secret-for-ef-migration-generation"
export DATABASE_PASSWORD="temp-password-for-ef-migration-generation"
export ASPNETCORE_ENVIRONMENT="Development"

# Create the migration (this creates both .cs and .Designer.cs files)
echo "📝 Running: dotnet ef migrations add ${MIGRATION_NAME}"
MIGRATION_OUTPUT=$(dotnet ef migrations add "${MIGRATION_NAME}" 2>&1)
MIGRATION_EXIT_CODE=$?

if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
    echo "✅ EF migration files created successfully"

    # Find the created migration files (.cs and .Designer.cs)
    MIGRATION_FILE=$(find Migrations -name "*${MIGRATION_NAME}.cs" -not -name "*.Designer.cs" -type f | head -1)
    DESIGNER_FILE=$(find Migrations -name "*${MIGRATION_NAME}.Designer.cs" -type f | head -1)

    if [ ! -z "$MIGRATION_FILE" ] && [ ! -z "$DESIGNER_FILE" ]; then
        echo "📄 Found migration files:"
        echo "   - ${MIGRATION_FILE}"
        echo "   - ${DESIGNER_FILE}"

        # Convert single quotes to double quotes for PostgreSQL JSONB
        ESCAPED_FEATURES_JSON=$(echo "${FEATURES_JSON}" | sed 's/"/\"\"/g')

        # Replace the entire content of the migration file with our SQL version
        cat > "$MIGRATION_FILE" << 'MIGRATION_CONTENT_EOF'
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
MIGRATION_CONTENT_EOF

        # Replace placeholders
        sed -i "s/MIGRATION_CLASS_NAME/${MIGRATION_NAME}/g" "$MIGRATION_FILE"
        sed -i "s/VERSION_PLACEHOLDER/${NEW_VERSION}/g" "$MIGRATION_FILE"
        sed -i "s/RELEASE_DATE_PLACEHOLDER/${RELEASE_DATE}/g" "$MIGRATION_FILE"
        sed -i "s/FEATURES_PLACEHOLDER/${ESCAPED_FEATURES_JSON}/g" "$MIGRATION_FILE"

        echo "✅ Updated migration with release note SQL"
        echo "✅ Designer file preserved: ${DESIGNER_FILE}"

        cd ..

        # Export for use in quick-deploy.sh
        echo "export RELEASE_VERSION=${NEW_VERSION}" > .release-note-env
        echo "export RELEASE_MIGRATION=HireThemNoW.Server/${MIGRATION_FILE}" >> .release-note-env

        echo "📄 Release note migration saved"
        echo ""
        echo "ℹ️  Migration will be automatically applied during deployment"
    else
        echo "⚠️  Migration files not found after creation"
        echo "   Looking for: *${MIGRATION_NAME}.cs"
        cd ..
    fi
else
    echo "⚠️  Failed to create EF migration"
    echo "   Error output:"
    echo "$MIGRATION_OUTPUT" | head -20
    echo ""
    echo "Creating manual migration files instead..."
    cd ..

    # Fallback: create manual migration files
    echo "⚠️  Using manual migration file creation (EF tools unavailable)"

    TIMESTAMP=$(date +"%Y%m%d%H%M%S")
    MIGRATION_FILE="HireThemNoW.Server/Migrations/${TIMESTAMP}_${MIGRATION_NAME}.cs"
    DESIGNER_FILE="HireThemNoW.Server/Migrations/${TIMESTAMP}_${MIGRATION_NAME}.Designer.cs"
    ESCAPED_FEATURES_JSON=$(echo "${FEATURES_JSON}" | sed 's/"/\"\"/g')

    # Create migration .cs file
    cat > "$MIGRATION_FILE" << MIGRATION_EOF
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HireThemNoW.Server.Migrations
{
    /// <inheritdoc />
    public partial class ${MIGRATION_NAME} : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                INSERT INTO \"ReleaseNotes\" (\"Version\", \"ReleaseDate\", \"Features\", \"IsPublished\", \"CreatedAt\")
                VALUES (
                    '${NEW_VERSION}',
                    '${RELEASE_DATE}'::timestamp with time zone,
                    '[${ESCAPED_FEATURES_JSON}]'::jsonb,
                    true,
                    '${RELEASE_DATE}'::timestamp with time zone
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DELETE FROM \"ReleaseNotes\" WHERE \"Version\" = '${NEW_VERSION}';
            ");
        }
    }
}
MIGRATION_EOF

    # Create Designer.cs file by copying from the latest existing one
    LATEST_DESIGNER=$(find HireThemNoW.Server/Migrations -name "*.Designer.cs" -type f | sort -r | head -1)

    if [ ! -z "$LATEST_DESIGNER" ]; then
        echo "📋 Copying Designer template from: $(basename $LATEST_DESIGNER)"
        cp "$LATEST_DESIGNER" "$DESIGNER_FILE"

        # Update migration name and timestamp in Designer file
        LATEST_MIGRATION_NAME=$(basename "$LATEST_DESIGNER" .Designer.cs | sed 's/^[0-9]*_//')
        sed -i "s/${LATEST_MIGRATION_NAME}/${MIGRATION_NAME}/g" "$DESIGNER_FILE"
        sed -i "s/Migration(\"[0-9]*_${LATEST_MIGRATION_NAME}\")/Migration(\"${TIMESTAMP}_${MIGRATION_NAME}\")/g" "$DESIGNER_FILE"

        echo "✅ Manual migration created: ${MIGRATION_FILE}"
        echo "✅ Designer file created: ${DESIGNER_FILE}"
    else
        echo "⚠️  Could not find Designer template, creating migration without Designer file"
        echo "✅ Manual migration created: ${MIGRATION_FILE}"
    fi

    # Export for use in quick-deploy.sh
    echo "export RELEASE_VERSION=${NEW_VERSION}" > .release-note-env
    echo "export RELEASE_MIGRATION=${MIGRATION_FILE}" >> .release-note-env

    echo "📄 Release note migration saved"
fi

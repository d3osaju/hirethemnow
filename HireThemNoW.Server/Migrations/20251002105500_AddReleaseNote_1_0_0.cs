using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HireThemNoW.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddReleaseNote_1_0_0 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                INSERT INTO ""ReleaseNotes"" (""Version"", ""ReleaseDate"", ""Features"", ""IsPublished"", ""CreatedAt"")
                VALUES (
                    '1.0.0',
                    '2025-10-02T05:19:51Z'::timestamp with time zone,
                    '[""Update React components"", ""Migrate profile pictures to S3"", ""Update React components"", ""Update React components"", ""Update React components"", ""Update page components"", ""Update backend code"", ""Update backend code"", ""Update backend code"", ""Configure HTTPS with custom domain (hirethemnow.xyz)"", ""Update backend code"", ""Update page components"", ""Update backend code"", ""Update page components"", ""Update page components"", ""Update API controllers"", ""Update React components"", ""Update backend code"", ""Update React components"", ""Update page components"", ""Update API controllers"", ""Update page components"", ""Update page components"", ""Update page components"", ""Update backend code"", ""Update backend code"", ""Update backend code"", ""Update backend code"", ""Update backend code"", ""Update backend code"", ""Update backend code"", ""Update React components"", ""Update React components"", ""Update React components"", ""Update React components"", ""Update React components"", ""Update React components"", ""Update React components"", ""Update React components"", ""Update React components"", ""Update React components"", ""Update API controllers"", ""Update backend code"", ""Update React components"", ""Update React components"", ""Update frontend code"", ""Update frontend code"", ""Update React components"", ""Update React components"", ""Update React components"", ""Update backend code"", ""Fix: Update user state immediately after profile save"", ""Fix: Restrict CORS to specific trusted origins"", ""Fix: Handle circular reference in JSON serialization"", ""Fix: Add global exception handler to preserve CORS headers"", ""Fix: Ensure CORS headers are sent for all API requests"", ""Fix: Fix SpaProxy assembly loading error causing 500 on resume upload"", ""Fix: Fix ESLint error - remove unused error variable"", ""Fix: Fix frontend API URLs for Fargate deployment"", ""Fix: Fix Tailwind CSS configuration and styling"", ""Fix: Fix Lambda API Gateway permission SourceArn format"", ""Fix: Fix S3 bucket policy resource ARN format"", ""Fix: Fix Lambda runtime issue - Switch to Node.js for inline code"", ""Fix: Fix IAM policy S3 resource ARN format"", ""Fix: Fix major CloudFormation deployment issues"", ""Fix: Fix CloudFormation circular dependency"", ""Fix: Fix React refresh and TypeScript issues"", ""Fix: Fix React refresh error by moving useAuth hook before component"", ""Fix: Fix all ESLint errors - Replace \'any\' types with proper types, remove unused variables, fix React hooks dependencies""]'::jsonb,
                    true,
                    '2025-10-02T05:19:51Z'::timestamp with time zone
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DELETE FROM ""ReleaseNotes"" WHERE ""Version"" = '1.0.0';
            ");
        }
    }
}

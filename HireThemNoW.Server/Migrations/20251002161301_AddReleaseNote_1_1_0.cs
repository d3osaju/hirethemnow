using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HireThemNoW.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddReleaseNote_1_1_0 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                INSERT INTO ""ReleaseNotes"" (""Version"", ""ReleaseDate"", ""Features"", ""IsPublished"", ""CreatedAt"")
                VALUES (
                    '1.1.0',
                    '2025-10-02T16:12:51Z'::timestamp with time zone,
                    '[""Add AI-powered resume analysis with Amazon Bedrock Nova Pro for comprehensive ATS scoring"", ""Implement 6-dimensional ATS scoring (Formatting, Keywords, Experience, Education, Skills, Achievements)"", ""Add automated resume analysis via Lambda function triggered by S3 uploads"", ""Create resume analysis API endpoints (get analysis + webhook for Lambda)"", ""Add resume_analyses table with comprehensive ATS scoring fields (25 columns)"", ""Add ATSScoreDisplay component for visualizing resume analysis results"", ""Auto-deploy AI infrastructure (Lambda + Bedrock) via GitHub Actions workflow"", ""Simplify backend architecture - remove job matching complexity, focus on ATS-only scoring"", ""Remove Application and JobPosting models - link ResumeAnalysis directly to User"", ""Fix GitHub workflow syntax error (boolean default value)"", ""Use stable AWS SDK packages (v4.x) - remove version conflicts"", ""Update logo to SVG format without background""]'::jsonb,
                    true,
                    '2025-10-02T16:12:51Z'::timestamp with time zone
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DELETE FROM ""ReleaseNotes"" WHERE ""Version"" = '1.1.0';
            ");
        }
    }
}

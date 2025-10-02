using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HireThemNoW.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddReleaseNote_1_1_2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                INSERT INTO ""ReleaseNotes"" (""Version"", ""ReleaseDate"", ""Features"", ""IsPublished"", ""CreatedAt"")
                VALUES (
                    '1.1.2',
                    '2025-10-02T18:26:29Z'::timestamp with time zone,
                    '[""Get email notification when your resume analysis is complete"", ""See real-time processing status when uploading resume with animated progress indicator"", ""Fix resume analysis - uploaded resumes now automatically trigger AI analysis""]'::jsonb,
                    true,
                    '2025-10-02T18:26:29Z'::timestamp with time zone
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DELETE FROM ""ReleaseNotes"" WHERE ""Version"" = '1.1.2';
            ");
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HireThemNoW.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddReleaseNote_1_1_1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                INSERT INTO ""ReleaseNotes"" (""Version"", ""ReleaseDate"", ""Features"", ""IsPublished"", ""CreatedAt"")
                VALUES (
                    '1.1.1',
                    '2025-10-02T17:15:12Z'::timestamp with time zone,
                    '[""Add Resume Analysis page with comprehensive ATS score visualization, strengths, improvements, and keywords analysis"", ""Add Resume Analysis menu item to dashboard sidebar""]'::jsonb,
                    true,
                    '2025-10-02T17:15:12Z'::timestamp with time zone
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DELETE FROM ""ReleaseNotes"" WHERE ""Version"" = '1.1.1';
            ");
        }
    }
}

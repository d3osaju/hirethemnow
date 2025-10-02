using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HireThemNoW.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddReleaseNote_1_0_2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                INSERT INTO ""ReleaseNotes"" (""Version"", ""ReleaseDate"", ""Features"", ""IsPublished"", ""CreatedAt"")
                VALUES (
                    '1.0.2',
                    '2025-10-02T11:49:54Z'::timestamp with time zone,
                    '[""Replace alert() calls with react-hot-toast notifications for better user experience"", ""Add local release-notes.json system for tracking changes and automated release note generation"", ""Fix profile picture display by adding S3 pre-signed URL generation to all auth endpoints (login, register, Google auth, getProfile)""]'::jsonb,
                    true,
                    '2025-10-02T11:49:54Z'::timestamp with time zone
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DELETE FROM ""ReleaseNotes"" WHERE ""Version"" = '1.0.2';
            ");
        }
    }
}

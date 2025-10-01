using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace HireThemNoW.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddReleaseNotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ReleaseNotes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Version = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ReleaseDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Features = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReleaseNotes", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "ReleaseNotes",
                columns: new[] { "Id", "CreatedAt", "Features", "IsPublished", "ReleaseDate", "Version" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 9, 30, 0, 0, 0, 0, DateTimeKind.Utc), "[\"Added Privacy Controls (Profile Visibility \\u0026 Analytics)\",\"Implemented Data Export functionality\",\"Added Account Deletion feature\",\"Fixed CORS issues with Industries endpoint\",\"Added top navbar with search and notifications\",\"Implemented notification badge showing trial days remaining\"]", true, new DateTime(2025, 9, 30, 0, 0, 0, 0, DateTimeKind.Utc), "1.2.0" },
                    { 2, new DateTime(2025, 9, 25, 0, 0, 0, 0, DateTimeKind.Utc), "[\"Email preferences management\",\"Profile update functionality\",\"Resume upload and download\",\"Trial period tracking\",\"User onboarding flow\"]", true, new DateTime(2025, 9, 25, 0, 0, 0, 0, DateTimeKind.Utc), "1.1.0" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReleaseNotes");
        }
    }
}

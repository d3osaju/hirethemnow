using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace HireThemNoW.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddColdMailGenerationHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ColdMailGenerationHistories",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    JobId = table.Column<int>(type: "integer", nullable: false),
                    IsSent = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ColdMailGenerationHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ColdMailGenerationHistories_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "public",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ColdMailGenerationHistories_job_opportunities_JobId",
                        column: x => x.JobId,
                        principalSchema: "public",
                        principalTable: "job_opportunities",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ColdMailGenerationHistories_IsSent",
                schema: "public",
                table: "ColdMailGenerationHistories",
                column: "IsSent");

            migrationBuilder.CreateIndex(
                name: "IX_ColdMailGenerationHistories_JobId",
                schema: "public",
                table: "ColdMailGenerationHistories",
                column: "JobId");

            migrationBuilder.CreateIndex(
                name: "IX_ColdMailGenerationHistories_UserId",
                schema: "public",
                table: "ColdMailGenerationHistories",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ColdMailGenerationHistories_UserId_JobId",
                schema: "public",
                table: "ColdMailGenerationHistories",
                columns: new[] { "UserId", "JobId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ColdMailGenerationHistories",
                schema: "public");
        }
    }
}

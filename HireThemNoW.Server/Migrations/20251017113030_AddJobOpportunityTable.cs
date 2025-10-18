using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace HireThemNoW.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddJobOpportunityTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "job_opportunities",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    job_title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    company = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    emails = table.Column<string>(type: "text", nullable: false),
                    email_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "summary"),
                    is_remote = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    salary = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    link = table.Column<string>(type: "text", nullable: false),
                    snippet = table.Column<string>(type: "text", nullable: false),
                    scraped_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_job_opportunities", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_job_opportunities_company",
                table: "job_opportunities",
                column: "company");

            migrationBuilder.CreateIndex(
                name: "IX_job_opportunities_created_at",
                table: "job_opportunities",
                column: "created_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "job_opportunities");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace HireThemNoW.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddResumeAnalysisTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "resume_analyses",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<string>(type: "text", nullable: false),
                    resume_url = table.Column<string>(type: "text", nullable: true),
                    technical_skills = table.Column<string>(type: "text", nullable: true),
                    soft_skills = table.Column<string>(type: "text", nullable: true),
                    programming_languages = table.Column<string>(type: "text", nullable: true),
                    tools = table.Column<string>(type: "text", nullable: true),
                    experience_summary = table.Column<string>(type: "text", nullable: true),
                    education = table.Column<string>(type: "text", nullable: true),
                    certifications = table.Column<string>(type: "text", nullable: true),
                    summary = table.Column<string>(type: "text", nullable: true),
                    years_of_experience = table.Column<int>(type: "integer", nullable: true),
                    s3_url = table.Column<string>(type: "text", nullable: true),
                    ats_overall_score = table.Column<int>(type: "integer", nullable: true),
                    ats_formatting_score = table.Column<int>(type: "integer", nullable: true),
                    ats_keywords_score = table.Column<int>(type: "integer", nullable: true),
                    ats_experience_score = table.Column<int>(type: "integer", nullable: true),
                    ats_education_score = table.Column<int>(type: "integer", nullable: true),
                    ats_skills_score = table.Column<int>(type: "integer", nullable: true),
                    ats_achievements_score = table.Column<int>(type: "integer", nullable: true),
                    strengths = table.Column<string>(type: "text", nullable: true),
                    weaknesses = table.Column<string>(type: "text", nullable: true),
                    improvements = table.Column<string>(type: "text", nullable: true),
                    keywords_found = table.Column<string>(type: "text", nullable: true),
                    keywords_missing = table.Column<string>(type: "text", nullable: true),
                    keyword_density = table.Column<int>(type: "integer", nullable: true),
                    readability_score = table.Column<int>(type: "integer", nullable: true),
                    readability_issues = table.Column<string>(type: "text", nullable: true),
                    recommendations = table.Column<string>(type: "text", nullable: true),
                    processed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_resume_analyses", x => x.id);
                    table.ForeignKey(
                        name: "FK_resume_analyses_Users_user_id",
                        column: x => x.user_id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_resume_analyses_user_id",
                table: "resume_analyses",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "resume_analyses");
        }
    }
}

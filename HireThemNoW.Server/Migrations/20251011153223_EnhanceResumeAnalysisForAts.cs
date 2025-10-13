using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HireThemNoW.Server.Migrations
{
    /// <inheritdoc />
    public partial class EnhanceResumeAnalysisForAts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "analysis_error",
                table: "resume_analyses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "resume_content_id",
                table: "resume_analyses",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "section_feedback",
                table: "resume_analyses",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_resume_analyses_resume_content_id",
                table: "resume_analyses",
                column: "resume_content_id");

            migrationBuilder.AddForeignKey(
                name: "FK_resume_analyses_resume_contents_resume_content_id",
                table: "resume_analyses",
                column: "resume_content_id",
                principalTable: "resume_contents",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_resume_analyses_resume_contents_resume_content_id",
                table: "resume_analyses");

            migrationBuilder.DropIndex(
                name: "IX_resume_analyses_resume_content_id",
                table: "resume_analyses");

            migrationBuilder.DropColumn(
                name: "analysis_error",
                table: "resume_analyses");

            migrationBuilder.DropColumn(
                name: "resume_content_id",
                table: "resume_analyses");

            migrationBuilder.DropColumn(
                name: "section_feedback",
                table: "resume_analyses");
        }
    }
}

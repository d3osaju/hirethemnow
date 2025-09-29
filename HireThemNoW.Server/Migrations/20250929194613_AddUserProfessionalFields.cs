using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HireThemNoW.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddUserProfessionalFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Experience",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Industry",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "Users",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Experience",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Industry",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "Users");
        }
    }
}

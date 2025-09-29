using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HireThemNoW.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddTrialFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasSeenTrialEndMessage",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsTrialActive",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TrialEndDate",
                table: "Users",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "TrialStartDate",
                table: "Users",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            // Set trial dates for existing users - give them 7 days from now
            migrationBuilder.Sql(@"
                UPDATE ""Users""
                SET ""TrialStartDate"" = NOW(),
                    ""TrialEndDate"" = NOW() + INTERVAL '7 days',
                    ""IsTrialActive"" = true,
                    ""HasSeenTrialEndMessage"" = false
                WHERE ""TrialStartDate"" = '0001-01-01 00:00:00+00'::timestamp with time zone;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HasSeenTrialEndMessage",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsTrialActive",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TrialEndDate",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TrialStartDate",
                table: "Users");
        }
    }
}

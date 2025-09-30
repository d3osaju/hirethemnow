using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace HireThemNoW.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddIndustryAndSkillExpertise : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Industries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Industries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SkillExpertises",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IndustryId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SkillExpertises", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SkillExpertises_Industries_IndustryId",
                        column: x => x.IndustryId,
                        principalTable: "Industries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Industries",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { 1, "Technology" },
                    { 2, "Finance" },
                    { 3, "Healthcare" },
                    { 4, "Education" },
                    { 5, "Marketing" },
                    { 6, "Sales" },
                    { 7, "Manufacturing" },
                    { 8, "Retail" },
                    { 9, "Hospitality" },
                    { 10, "Construction" }
                });

            migrationBuilder.InsertData(
                table: "SkillExpertises",
                columns: new[] { "Id", "IndustryId", "Name" },
                values: new object[,]
                {
                    { 1, 1, "JavaScript" },
                    { 2, 1, "Python" },
                    { 3, 1, "React" },
                    { 4, 1, "Node.js" },
                    { 5, 1, "TypeScript" },
                    { 6, 1, "C#" },
                    { 7, 1, "Java" },
                    { 8, 1, "SQL" },
                    { 9, 1, "AWS" },
                    { 10, 1, "Docker" },
                    { 11, 1, "Kubernetes" },
                    { 12, 1, "DevOps" },
                    { 13, 1, "Machine Learning" },
                    { 14, 1, "Data Science" },
                    { 15, 1, "Cybersecurity" },
                    { 16, 2, "Financial Analysis" },
                    { 17, 2, "Accounting" },
                    { 18, 2, "Risk Management" },
                    { 19, 2, "Investment Banking" },
                    { 20, 2, "Portfolio Management" },
                    { 21, 2, "Financial Modeling" },
                    { 22, 2, "Excel" },
                    { 23, 2, "QuickBooks" },
                    { 24, 2, "Tax Preparation" },
                    { 25, 2, "Auditing" },
                    { 26, 3, "Patient Care" },
                    { 27, 3, "Medical Coding" },
                    { 28, 3, "Nursing" },
                    { 29, 3, "EMR Systems" },
                    { 30, 3, "Healthcare Administration" },
                    { 31, 3, "Medical Terminology" },
                    { 32, 3, "HIPAA Compliance" },
                    { 33, 3, "Clinical Research" },
                    { 34, 3, "Pharmacy" },
                    { 35, 3, "Physical Therapy" },
                    { 36, 4, "Curriculum Development" },
                    { 37, 4, "Classroom Management" },
                    { 38, 4, "Educational Technology" },
                    { 39, 4, "Lesson Planning" },
                    { 40, 4, "Student Assessment" },
                    { 41, 4, "Online Teaching" },
                    { 42, 4, "Special Education" },
                    { 43, 4, "Tutoring" },
                    { 44, 4, "Academic Advising" },
                    { 45, 4, "Educational Psychology" },
                    { 46, 5, "Digital Marketing" },
                    { 47, 5, "SEO" },
                    { 48, 5, "Content Marketing" },
                    { 49, 5, "Social Media Marketing" },
                    { 50, 5, "Email Marketing" },
                    { 51, 5, "Google Analytics" },
                    { 52, 5, "Brand Management" },
                    { 53, 5, "Market Research" },
                    { 54, 5, "Copywriting" },
                    { 55, 5, "PPC Advertising" },
                    { 56, 6, "B2B Sales" },
                    { 57, 6, "B2C Sales" },
                    { 58, 6, "CRM Software" },
                    { 59, 6, "Lead Generation" },
                    { 60, 6, "Negotiation" },
                    { 61, 6, "Account Management" },
                    { 62, 6, "Sales Strategy" },
                    { 63, 6, "Cold Calling" },
                    { 64, 6, "Salesforce" },
                    { 65, 6, "Customer Relationship" },
                    { 66, 7, "Quality Control" },
                    { 67, 7, "Lean Manufacturing" },
                    { 68, 7, "Six Sigma" },
                    { 69, 7, "Production Planning" },
                    { 70, 7, "Supply Chain Management" },
                    { 71, 7, "CAD/CAM" },
                    { 72, 7, "Process Improvement" },
                    { 73, 7, "Safety Compliance" },
                    { 74, 7, "Inventory Management" },
                    { 75, 7, "Equipment Maintenance" },
                    { 76, 8, "Customer Service" },
                    { 77, 8, "Merchandising" },
                    { 78, 8, "Point of Sale (POS)" },
                    { 79, 8, "Visual Merchandising" },
                    { 80, 8, "Store Management" },
                    { 81, 8, "Retail Analytics" },
                    { 82, 8, "Loss Prevention" },
                    { 83, 8, "Cash Handling" },
                    { 84, 8, "Product Knowledge" },
                    { 85, 8, "E-commerce" },
                    { 86, 9, "Guest Relations" },
                    { 87, 9, "Hotel Management" },
                    { 88, 9, "Food Service" },
                    { 89, 9, "Event Planning" },
                    { 90, 9, "Housekeeping Management" },
                    { 91, 9, "Front Desk Operations" },
                    { 92, 9, "Culinary Arts" },
                    { 93, 9, "Bartending" },
                    { 94, 9, "Tourism" },
                    { 95, 9, "Reservation Systems" },
                    { 96, 10, "Project Management" },
                    { 97, 10, "Blueprint Reading" },
                    { 98, 10, "Carpentry" },
                    { 99, 10, "Electrical Work" },
                    { 100, 10, "Plumbing" },
                    { 101, 10, "OSHA Compliance" },
                    { 102, 10, "Estimating" },
                    { 103, 10, "Heavy Equipment Operation" },
                    { 104, 10, "Welding" },
                    { 105, 10, "Site Supervision" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Industries_Name",
                table: "Industries",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SkillExpertises_IndustryId",
                table: "SkillExpertises",
                column: "IndustryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SkillExpertises");

            migrationBuilder.DropTable(
                name: "Industries");
        }
    }
}

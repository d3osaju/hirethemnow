using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using HireThemNoW.Server.Models;
using System.Text.Json;

namespace HireThemNoW.Server.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Email> Emails { get; set; }
    public DbSet<EmailPreference> EmailPreferences { get; set; }
    public DbSet<Industry> Industries { get; set; }
    public DbSet<SkillExpertise> SkillExpertises { get; set; }
    public DbSet<ReleaseNote> ReleaseNotes { get; set; }
    public DbSet<ResumeAnalysis> ResumeAnalyses { get; set; }
    public DbSet<ResumeContent> ResumeContents { get; set; }
    public DbSet<JobOpportunity> JobOpportunities { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Configure default schema
        modelBuilder.HasDefaultSchema("public");

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Email).IsRequired();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Skills)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                    v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions)null!) ?? new List<string>())
                .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                    (c1, c2) => c1!.SequenceEqual(c2!),
                    c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                    c => c.ToList()));
        });

        // Email configuration
        modelBuilder.Entity<Email>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired();
            entity.Property(e => e.ToEmail).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Subject).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Body).IsRequired();
            entity.Property(e => e.ResumeUrl).HasMaxLength(500);
            entity.Property(e => e.IsSent).HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // Indexes for efficient querying
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.IsSent);
            entity.HasIndex(e => new { e.UserId, e.IsSent });
            
            // Foreign key relationship
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // EmailPreference configuration
        modelBuilder.Entity<EmailPreference>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.UserId).IsRequired();
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.HasOne(e => e.User)
                .WithOne()
                .HasForeignKey<EmailPreference>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Industry configuration
        modelBuilder.Entity<Industry>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // SkillExpertise configuration
        modelBuilder.Entity<SkillExpertise>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.HasOne(e => e.Industry)
                .WithMany(i => i.Skills)
                .HasForeignKey(e => e.IndustryId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ReleaseNote configuration
        modelBuilder.Entity<ReleaseNote>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Version).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Features)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null!),
                    v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions)null!) ?? new List<string>())
                .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                    (c1, c2) => c1!.SequenceEqual(c2!),
                    c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                    c => c.ToList()));
        });

        // ResumeAnalysis configuration
        modelBuilder.Entity<ResumeAnalysis>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired();
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.ResumeContent)
                .WithMany()
                .HasForeignKey(e => e.ResumeContentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ResumeContent configuration
        modelBuilder.Entity<ResumeContent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired();
            entity.Property(e => e.S3Key).IsRequired();
            entity.Property(e => e.FileName).IsRequired();
            entity.Property(e => e.ContentType).IsRequired();
            entity.Property(e => e.ParsedContent).IsRequired();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.UserId, e.UploadedAt });
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // JobOpportunity configuration
        modelBuilder.Entity<JobOpportunity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.JobTitle).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Company).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Location).HasMaxLength(200);
            entity.Property(e => e.EmailType).HasMaxLength(50).HasDefaultValue("summary");
            entity.Property(e => e.IsRemote).HasDefaultValue(false);
            entity.Property(e => e.Salary).HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(e => e.Company);
            entity.HasIndex(e => e.CreatedAt);
        });

        // Seed data
        modelBuilder.Entity<Industry>().HasData(
            new Industry { Id = 1, Name = "Technology" },
            new Industry { Id = 2, Name = "Finance" },
            new Industry { Id = 3, Name = "Healthcare" },
            new Industry { Id = 4, Name = "Education" },
            new Industry { Id = 5, Name = "Marketing" },
            new Industry { Id = 6, Name = "Sales" },
            new Industry { Id = 7, Name = "Manufacturing" },
            new Industry { Id = 8, Name = "Retail" },
            new Industry { Id = 9, Name = "Hospitality" },
            new Industry { Id = 10, Name = "Construction" }
        );

        modelBuilder.Entity<SkillExpertise>().HasData(
            // Technology skills
            new SkillExpertise { Id = 1, Name = "JavaScript", IndustryId = 1 },
            new SkillExpertise { Id = 2, Name = "Python", IndustryId = 1 },
            new SkillExpertise { Id = 3, Name = "React", IndustryId = 1 },
            new SkillExpertise { Id = 4, Name = "Node.js", IndustryId = 1 },
            new SkillExpertise { Id = 5, Name = "TypeScript", IndustryId = 1 },
            new SkillExpertise { Id = 6, Name = "C#", IndustryId = 1 },
            new SkillExpertise { Id = 7, Name = "Java", IndustryId = 1 },
            new SkillExpertise { Id = 8, Name = "SQL", IndustryId = 1 },
            new SkillExpertise { Id = 9, Name = "AWS", IndustryId = 1 },
            new SkillExpertise { Id = 10, Name = "Docker", IndustryId = 1 },
            new SkillExpertise { Id = 11, Name = "Kubernetes", IndustryId = 1 },
            new SkillExpertise { Id = 12, Name = "DevOps", IndustryId = 1 },
            new SkillExpertise { Id = 13, Name = "Machine Learning", IndustryId = 1 },
            new SkillExpertise { Id = 14, Name = "Data Science", IndustryId = 1 },
            new SkillExpertise { Id = 15, Name = "Cybersecurity", IndustryId = 1 },

            // Finance skills
            new SkillExpertise { Id = 16, Name = "Financial Analysis", IndustryId = 2 },
            new SkillExpertise { Id = 17, Name = "Accounting", IndustryId = 2 },
            new SkillExpertise { Id = 18, Name = "Risk Management", IndustryId = 2 },
            new SkillExpertise { Id = 19, Name = "Investment Banking", IndustryId = 2 },
            new SkillExpertise { Id = 20, Name = "Portfolio Management", IndustryId = 2 },
            new SkillExpertise { Id = 21, Name = "Financial Modeling", IndustryId = 2 },
            new SkillExpertise { Id = 22, Name = "Excel", IndustryId = 2 },
            new SkillExpertise { Id = 23, Name = "QuickBooks", IndustryId = 2 },
            new SkillExpertise { Id = 24, Name = "Tax Preparation", IndustryId = 2 },
            new SkillExpertise { Id = 25, Name = "Auditing", IndustryId = 2 },

            // Healthcare skills
            new SkillExpertise { Id = 26, Name = "Patient Care", IndustryId = 3 },
            new SkillExpertise { Id = 27, Name = "Medical Coding", IndustryId = 3 },
            new SkillExpertise { Id = 28, Name = "Nursing", IndustryId = 3 },
            new SkillExpertise { Id = 29, Name = "EMR Systems", IndustryId = 3 },
            new SkillExpertise { Id = 30, Name = "Healthcare Administration", IndustryId = 3 },
            new SkillExpertise { Id = 31, Name = "Medical Terminology", IndustryId = 3 },
            new SkillExpertise { Id = 32, Name = "HIPAA Compliance", IndustryId = 3 },
            new SkillExpertise { Id = 33, Name = "Clinical Research", IndustryId = 3 },
            new SkillExpertise { Id = 34, Name = "Pharmacy", IndustryId = 3 },
            new SkillExpertise { Id = 35, Name = "Physical Therapy", IndustryId = 3 },

            // Education skills
            new SkillExpertise { Id = 36, Name = "Curriculum Development", IndustryId = 4 },
            new SkillExpertise { Id = 37, Name = "Classroom Management", IndustryId = 4 },
            new SkillExpertise { Id = 38, Name = "Educational Technology", IndustryId = 4 },
            new SkillExpertise { Id = 39, Name = "Lesson Planning", IndustryId = 4 },
            new SkillExpertise { Id = 40, Name = "Student Assessment", IndustryId = 4 },
            new SkillExpertise { Id = 41, Name = "Online Teaching", IndustryId = 4 },
            new SkillExpertise { Id = 42, Name = "Special Education", IndustryId = 4 },
            new SkillExpertise { Id = 43, Name = "Tutoring", IndustryId = 4 },
            new SkillExpertise { Id = 44, Name = "Academic Advising", IndustryId = 4 },
            new SkillExpertise { Id = 45, Name = "Educational Psychology", IndustryId = 4 },

            // Marketing skills
            new SkillExpertise { Id = 46, Name = "Digital Marketing", IndustryId = 5 },
            new SkillExpertise { Id = 47, Name = "SEO", IndustryId = 5 },
            new SkillExpertise { Id = 48, Name = "Content Marketing", IndustryId = 5 },
            new SkillExpertise { Id = 49, Name = "Social Media Marketing", IndustryId = 5 },
            new SkillExpertise { Id = 50, Name = "Email Marketing", IndustryId = 5 },
            new SkillExpertise { Id = 51, Name = "Google Analytics", IndustryId = 5 },
            new SkillExpertise { Id = 52, Name = "Brand Management", IndustryId = 5 },
            new SkillExpertise { Id = 53, Name = "Market Research", IndustryId = 5 },
            new SkillExpertise { Id = 54, Name = "Copywriting", IndustryId = 5 },
            new SkillExpertise { Id = 55, Name = "PPC Advertising", IndustryId = 5 },

            // Sales skills
            new SkillExpertise { Id = 56, Name = "B2B Sales", IndustryId = 6 },
            new SkillExpertise { Id = 57, Name = "B2C Sales", IndustryId = 6 },
            new SkillExpertise { Id = 58, Name = "CRM Software", IndustryId = 6 },
            new SkillExpertise { Id = 59, Name = "Lead Generation", IndustryId = 6 },
            new SkillExpertise { Id = 60, Name = "Negotiation", IndustryId = 6 },
            new SkillExpertise { Id = 61, Name = "Account Management", IndustryId = 6 },
            new SkillExpertise { Id = 62, Name = "Sales Strategy", IndustryId = 6 },
            new SkillExpertise { Id = 63, Name = "Cold Calling", IndustryId = 6 },
            new SkillExpertise { Id = 64, Name = "Salesforce", IndustryId = 6 },
            new SkillExpertise { Id = 65, Name = "Customer Relationship", IndustryId = 6 },

            // Manufacturing skills
            new SkillExpertise { Id = 66, Name = "Quality Control", IndustryId = 7 },
            new SkillExpertise { Id = 67, Name = "Lean Manufacturing", IndustryId = 7 },
            new SkillExpertise { Id = 68, Name = "Six Sigma", IndustryId = 7 },
            new SkillExpertise { Id = 69, Name = "Production Planning", IndustryId = 7 },
            new SkillExpertise { Id = 70, Name = "Supply Chain Management", IndustryId = 7 },
            new SkillExpertise { Id = 71, Name = "CAD/CAM", IndustryId = 7 },
            new SkillExpertise { Id = 72, Name = "Process Improvement", IndustryId = 7 },
            new SkillExpertise { Id = 73, Name = "Safety Compliance", IndustryId = 7 },
            new SkillExpertise { Id = 74, Name = "Inventory Management", IndustryId = 7 },
            new SkillExpertise { Id = 75, Name = "Equipment Maintenance", IndustryId = 7 },

            // Retail skills
            new SkillExpertise { Id = 76, Name = "Customer Service", IndustryId = 8 },
            new SkillExpertise { Id = 77, Name = "Merchandising", IndustryId = 8 },
            new SkillExpertise { Id = 78, Name = "Point of Sale (POS)", IndustryId = 8 },
            new SkillExpertise { Id = 79, Name = "Visual Merchandising", IndustryId = 8 },
            new SkillExpertise { Id = 80, Name = "Store Management", IndustryId = 8 },
            new SkillExpertise { Id = 81, Name = "Retail Analytics", IndustryId = 8 },
            new SkillExpertise { Id = 82, Name = "Loss Prevention", IndustryId = 8 },
            new SkillExpertise { Id = 83, Name = "Cash Handling", IndustryId = 8 },
            new SkillExpertise { Id = 84, Name = "Product Knowledge", IndustryId = 8 },
            new SkillExpertise { Id = 85, Name = "E-commerce", IndustryId = 8 },

            // Hospitality skills
            new SkillExpertise { Id = 86, Name = "Guest Relations", IndustryId = 9 },
            new SkillExpertise { Id = 87, Name = "Hotel Management", IndustryId = 9 },
            new SkillExpertise { Id = 88, Name = "Food Service", IndustryId = 9 },
            new SkillExpertise { Id = 89, Name = "Event Planning", IndustryId = 9 },
            new SkillExpertise { Id = 90, Name = "Housekeeping Management", IndustryId = 9 },
            new SkillExpertise { Id = 91, Name = "Front Desk Operations", IndustryId = 9 },
            new SkillExpertise { Id = 92, Name = "Culinary Arts", IndustryId = 9 },
            new SkillExpertise { Id = 93, Name = "Bartending", IndustryId = 9 },
            new SkillExpertise { Id = 94, Name = "Tourism", IndustryId = 9 },
            new SkillExpertise { Id = 95, Name = "Reservation Systems", IndustryId = 9 },

            // Construction skills
            new SkillExpertise { Id = 96, Name = "Project Management", IndustryId = 10 },
            new SkillExpertise { Id = 97, Name = "Blueprint Reading", IndustryId = 10 },
            new SkillExpertise { Id = 98, Name = "Carpentry", IndustryId = 10 },
            new SkillExpertise { Id = 99, Name = "Electrical Work", IndustryId = 10 },
            new SkillExpertise { Id = 100, Name = "Plumbing", IndustryId = 10 },
            new SkillExpertise { Id = 101, Name = "OSHA Compliance", IndustryId = 10 },
            new SkillExpertise { Id = 102, Name = "Estimating", IndustryId = 10 },
            new SkillExpertise { Id = 103, Name = "Heavy Equipment Operation", IndustryId = 10 },
            new SkillExpertise { Id = 104, Name = "Welding", IndustryId = 10 },
            new SkillExpertise { Id = 105, Name = "Site Supervision", IndustryId = 10 }
        );

        // Seed Release Notes
        modelBuilder.Entity<ReleaseNote>().HasData(
            new ReleaseNote
            {
                Id = 1,
                Version = "1.2.0",
                ReleaseDate = new DateTime(2025, 9, 30),
                Features = new List<string>
                {
                    "Added Privacy Controls (Profile Visibility & Analytics)",
                    "Implemented Data Export functionality",
                    "Added Account Deletion feature",
                    "Fixed CORS issues with Industries endpoint",
                    "Added top navbar with search and notifications",
                    "Implemented notification badge showing trial days remaining"
                },
                IsPublished = true,
                CreatedAt = new DateTime(2025, 9, 30)
            },
            new ReleaseNote
            {
                Id = 2,
                Version = "1.1.0",
                ReleaseDate = new DateTime(2025, 9, 25),
                Features = new List<string>
                {
                    "Email preferences management",
                    "Profile update functionality",
                    "Resume upload and download",
                    "Trial period tracking",
                    "User onboarding flow"
                },
                IsPublished = true,
                CreatedAt = new DateTime(2025, 9, 25)
            }
        );
    }

}
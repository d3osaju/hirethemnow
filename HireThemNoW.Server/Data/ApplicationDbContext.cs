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
    public DbSet<EmailPreference> EmailPreferences { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

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


    }

}
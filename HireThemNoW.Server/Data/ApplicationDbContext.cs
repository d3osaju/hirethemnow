using Microsoft.EntityFrameworkCore;
using HireThemNoW.Server.Models;
using System.Text.Json;

namespace HireThemNoW.Server.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }

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
                    v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions)null!) ?? new List<string>());
        });


    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            // This will only be used if no options are provided in DI
            optionsBuilder.UseNpgsql("Host=localhost;Database=hirethemnow;Username=postgres;Password=postgres");
        }
    }
}
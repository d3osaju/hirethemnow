using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace HireThemNoW.Server.Data
{
    public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
    {
        public ApplicationDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
            
            // Use the development connection string for migrations
            optionsBuilder.UseNpgsql("Host=localhost;Database=hirethemnow_dev;Username=postgres;Password=postgres;");
            
            return new ApplicationDbContext(optionsBuilder.Options);
        }
    }
}
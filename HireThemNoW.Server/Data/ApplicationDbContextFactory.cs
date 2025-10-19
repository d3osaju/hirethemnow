using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace HireThemNoW.Server.Data
{
    public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
    {
        public ApplicationDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
            
            // Use the production connection string for migrations
            optionsBuilder.UseNpgsql("Host=hirethemnow-db.ca5kaqqsyk65.us-east-1.rds.amazonaws.com;Database=postgres;Username=postgres;Password=hirethem4us;SearchPath=public;");
            
            return new ApplicationDbContext(optionsBuilder.Options);
        }
    }
}
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using System.Text;
using HireThemNoW.Server.Services;
using HireThemNoW.Server.Data;
using Amazon.S3;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// Add database context
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

    // Override with environment variables if they exist (for production deployment)
    var dbHost = builder.Configuration["DATABASE_HOST"];
    var dbName = builder.Configuration["DATABASE_NAME"];
    var dbUser = builder.Configuration["DATABASE_USER"];
    var dbPassword = builder.Configuration["DATABASE_PASSWORD"];

    if (!string.IsNullOrEmpty(dbHost) && !string.IsNullOrEmpty(dbName) &&
        !string.IsNullOrEmpty(dbUser) && !string.IsNullOrEmpty(dbPassword))
    {
        connectionString = $"Host={dbHost};Database={dbName};Username={dbUser};Password={dbPassword};";
        Console.WriteLine($"Using production database connection: Host={dbHost};Database={dbName};Username={dbUser}");
    }
    else
    {
        Console.WriteLine("Using default connection string from appsettings.json");
    }

    options.UseNpgsql(connectionString);
});

// Add data service
builder.Services.AddScoped<IDataService, DatabaseDataService>();

// Add AWS Services
var awsServiceUrl = builder.Configuration["AWS_SERVICE_URL"];
if (!string.IsNullOrEmpty(awsServiceUrl))
{
    // LocalStack configuration for local development
    builder.Services.AddSingleton<IAmazonS3>(sp =>
    {
        var config = new Amazon.S3.AmazonS3Config
        {
            ServiceURL = awsServiceUrl,
            ForcePathStyle = true // Required for LocalStack
        };
        return new Amazon.S3.AmazonS3Client(config);
    });
}
else
{
    // Production AWS configuration
    builder.Services.AddAWSService<IAmazonS3>();
}
builder.Services.AddScoped<IS3Service, S3Service>();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add JWT Authentication
var jwtSecret = builder.Configuration["JWT_SECRET"] ?? throw new InvalidOperationException("JWT_SECRET environment variable is required");
var key = Encoding.ASCII.GetBytes(jwtSecret);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };
    });

// Add CORS - Allow cross-origin requests from frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(
                "https://www.hirethemnow.xyz",
                "https://hirethemnow.xyz",
                "http://localhost:8080"
              )
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Run database migrations on startup
using (var scope = app.Services.CreateScope())
{
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Console.WriteLine("Running database migrations...");
        context.Database.Migrate();
        Console.WriteLine("Database migrations completed successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database migration failed: {ex.Message}");
        // Don't stop the application, continue to serve requests
        // This allows the app to start even if migrations fail
    }
}

// Serve static files from wwwroot (frontend files)
app.UseDefaultFiles();
app.UseStaticFiles();

// Serve uploaded files (profile pictures, resumes, etc.)
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "uploads")),
    RequestPath = "/uploads"
});

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// No HTTPS redirection - ALB handles this
// app.UseHttpsRedirection();

// Enable CORS - MUST be before Authentication
app.UseCors("AllowReactApp");

// Add exception handler that preserves CORS headers
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync("{\"success\":false,\"message\":\"An error occurred processing your request\"}");
    });
});

// Add Authentication before Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Fallback to index.html for SPA routing
app.MapFallbackToFile("/index.html");

app.Run();

// Make Program class accessible for integration tests
public partial class Program { }

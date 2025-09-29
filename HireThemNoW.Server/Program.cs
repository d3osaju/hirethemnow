using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using System.Text;
using HireThemNoW.Server.Services;
using HireThemNoW.Server.Data;
using Amazon.S3;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();

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
    }

    options.UseNpgsql(connectionString);
});

// Add data service
builder.Services.AddScoped<IDataService, DatabaseDataService>();

// Add AWS Services
builder.Services.AddAWSService<IAmazonS3>();
builder.Services.AddScoped<IS3Service, S3Service>();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add JWT Authentication
var jwtSecret = builder.Configuration["JWT_SECRET"] ?? "ae9d27decc25cb45671ce98206e402e2";
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

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        var allowedOrigins = new List<string>();

        // Add development URLs
        if (builder.Environment.IsDevelopment())
        {
            allowedOrigins.AddRange(new[]
            {
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175",
                "http://localhost:3000"
            });
        }

        // Add production URLs from environment or configuration
        var productionOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>();
        if (productionOrigins != null && productionOrigins.Length > 0)
        {
            allowedOrigins.AddRange(productionOrigins);
        }
        else
        {
            // Fallback production URLs - CloudFront distributions
            allowedOrigins.AddRange(new[]
            {
                "https://d2mddiq1c6w52v.cloudfront.net",
                "https://d203avobknjbyh.cloudfront.net",
                "https://doswhc5mmajby.cloudfront.net"
            });

            // Allow any CloudFront distribution and ALB for flexibility
            allowedOrigins.Add("*");
        }

        // For simplicity in containerized deployment, allow all origins
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Serve static files from wwwroot (frontend files)
app.UseDefaultFiles();
app.UseStaticFiles();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// No HTTPS redirection - ALB handles this
// app.UseHttpsRedirection();

// Enable CORS
app.UseCors("AllowReactApp");

// Add Authentication before Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Fallback to index.html for SPA routing
app.MapFallbackToFile("/index.html");

app.Run();

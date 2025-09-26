var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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
            // Fallback production URLs
            allowedOrigins.AddRange(new[]
            {
                "https://d203avobknjbyh.cloudfront.net",
                "https://doswhc5mmajby.cloudfront.net"
            });
        }

        policy.WithOrigins(allowedOrigins.ToArray())
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Enable CORS
app.UseCors("AllowReactApp");

app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

app.Run();

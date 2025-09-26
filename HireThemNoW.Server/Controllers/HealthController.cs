using Microsoft.AspNetCore.Mvc;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public ActionResult<object> Get()
    {
        return Ok(new
        {
            status = "healthy",
            message = "HireThemNow API is running on Lambda",
            timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss UTC"),
            environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown"
        });
    }

    [HttpGet("test")]
    public ActionResult<object> Test()
    {
        return Ok(new
        {
            message = "Test endpoint working",
            success = true
        });
    }
}
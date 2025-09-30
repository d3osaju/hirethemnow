using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HireThemNoW.Server.Data;
using HireThemNoW.Server.Models;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IndustriesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public IndustriesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<Industry>>>> GetIndustries()
    {
        try
        {
            var industries = await _context.Industries
                .Include(i => i.Skills)
                .OrderBy(i => i.Name)
                .ToListAsync();

            return Ok(new ApiResponse<List<Industry>>
            {
                Success = true,
                Message = "Industries retrieved successfully",
                Data = industries
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<Industry>>
            {
                Success = false,
                Message = $"Error retrieving industries: {ex.Message}"
            });
        }
    }

    [HttpGet("{industryId}/skills")]
    public async Task<ActionResult<ApiResponse<List<SkillExpertise>>>> GetSkillsByIndustry(int industryId)
    {
        try
        {
            var skills = await _context.SkillExpertises
                .Where(s => s.IndustryId == industryId)
                .OrderBy(s => s.Name)
                .ToListAsync();

            return Ok(new ApiResponse<List<SkillExpertise>>
            {
                Success = true,
                Message = "Skills retrieved successfully",
                Data = skills
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<SkillExpertise>>
            {
                Success = false,
                Message = $"Error retrieving skills: {ex.Message}"
            });
        }
    }
}
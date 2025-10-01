using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HireThemNoW.Server.Data;
using HireThemNoW.Server.Models;

namespace HireThemNoW.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReleaseNotesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ReleaseNotesController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/releasenotes - Get latest 2 published release notes
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ReleaseNote>>>> GetReleaseNotes()
    {
        try
        {
            var releaseNotes = await _context.ReleaseNotes
                .Where(rn => rn.IsPublished)
                .OrderByDescending(rn => rn.ReleaseDate)
                .Take(2)
                .ToListAsync();

            return Ok(new ApiResponse<List<ReleaseNote>>
            {
                Success = true,
                Message = "Release notes retrieved successfully",
                Data = releaseNotes
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<ReleaseNote>>
            {
                Success = false,
                Message = $"Error retrieving release notes: {ex.Message}"
            });
        }
    }

    // GET: api/releasenotes/{id} - Get specific release note
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ReleaseNote>>> GetReleaseNote(int id)
    {
        try
        {
            var releaseNote = await _context.ReleaseNotes.FindAsync(id);

            if (releaseNote == null)
            {
                return NotFound(new ApiResponse<ReleaseNote>
                {
                    Success = false,
                    Message = "Release note not found"
                });
            }

            return Ok(new ApiResponse<ReleaseNote>
            {
                Success = true,
                Message = "Release note retrieved successfully",
                Data = releaseNote
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<ReleaseNote>
            {
                Success = false,
                Message = $"Error retrieving release note: {ex.Message}"
            });
        }
    }

    // POST: api/releasenotes - Create new release note (Admin only)
    [HttpPost]
    [Authorize] // Add role check for admin in production
    public async Task<ActionResult<ApiResponse<ReleaseNote>>> CreateReleaseNote([FromBody] CreateReleaseNoteRequest request)
    {
        try
        {
            var releaseNote = new ReleaseNote
            {
                Version = request.Version,
                ReleaseDate = request.ReleaseDate,
                Features = request.Features,
                IsPublished = request.IsPublished,
                CreatedAt = DateTime.UtcNow
            };

            _context.ReleaseNotes.Add(releaseNote);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetReleaseNote), new { id = releaseNote.Id }, new ApiResponse<ReleaseNote>
            {
                Success = true,
                Message = "Release note created successfully",
                Data = releaseNote
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<ReleaseNote>
            {
                Success = false,
                Message = $"Error creating release note: {ex.Message}"
            });
        }
    }

    // PUT: api/releasenotes/{id} - Update release note (Admin only)
    [HttpPut("{id}")]
    [Authorize] // Add role check for admin in production
    public async Task<ActionResult<ApiResponse<ReleaseNote>>> UpdateReleaseNote(int id, [FromBody] UpdateReleaseNoteRequest request)
    {
        try
        {
            var releaseNote = await _context.ReleaseNotes.FindAsync(id);

            if (releaseNote == null)
            {
                return NotFound(new ApiResponse<ReleaseNote>
                {
                    Success = false,
                    Message = "Release note not found"
                });
            }

            if (request.Version != null) releaseNote.Version = request.Version;
            if (request.ReleaseDate.HasValue) releaseNote.ReleaseDate = request.ReleaseDate.Value;
            if (request.Features != null) releaseNote.Features = request.Features;
            if (request.IsPublished.HasValue) releaseNote.IsPublished = request.IsPublished.Value;

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<ReleaseNote>
            {
                Success = true,
                Message = "Release note updated successfully",
                Data = releaseNote
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<ReleaseNote>
            {
                Success = false,
                Message = $"Error updating release note: {ex.Message}"
            });
        }
    }

    // DELETE: api/releasenotes/{id} - Delete release note (Admin only)
    [HttpDelete("{id}")]
    [Authorize] // Add role check for admin in production
    public async Task<ActionResult<ApiResponse<object>>> DeleteReleaseNote(int id)
    {
        try
        {
            var releaseNote = await _context.ReleaseNotes.FindAsync(id);

            if (releaseNote == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Release note not found"
                });
            }

            _context.ReleaseNotes.Remove(releaseNote);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Release note deleted successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = $"Error deleting release note: {ex.Message}"
            });
        }
    }
}

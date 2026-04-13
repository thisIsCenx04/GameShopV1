using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GameStore.API.DTOs.Common;
using GameStore.API.Repositories.Data;

namespace GameStore.API.Controllers;

/// <summary>
/// Public banners endpoint — returns active banners for homepage carousel
/// </summary>
[ApiController]
[Route("api/v1/banners")]
public class BannersController : ControllerBase
{
    private readonly AppDbContext _db;

    public BannersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetActiveBanners()
    {
        var banners = await _db.Banners
            .Where(b => b.IsActive)
            .OrderBy(b => b.SortOrder)
            .Select(b => new
            {
                b.Id,
                b.Title,
                b.ImageUrl,
                b.LinkUrl,
                b.SortOrder
            })
            .ToListAsync();

        return Ok(ApiResponse.Success(banners));
    }
}

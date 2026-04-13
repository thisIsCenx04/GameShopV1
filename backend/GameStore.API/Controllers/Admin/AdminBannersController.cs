using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GameStore.API.DTOs.Common;
using GameStore.API.Models.Entities;
using GameStore.API.Repositories.Data;

namespace GameStore.API.Controllers.Admin;

/// <summary>
/// Admin banner CRUD — manage homepage carousel banners
/// </summary>
[ApiController]
[Route("api/v1/admin/banners")]
[Authorize(Roles = "Admin")]
public class AdminBannersController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminBannersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var banners = await _db.Banners
            .OrderBy(b => b.SortOrder)
            .ToListAsync();

        return Ok(ApiResponse.Success(banners));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] BannerRequest request)
    {
        var banner = new Banner
        {
            Title = request.Title,
            ImageUrl = request.ImageUrl,
            LinkUrl = request.LinkUrl,
            IsActive = request.IsActive,
            SortOrder = request.SortOrder,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _db.Banners.Add(banner);
        await _db.SaveChangesAsync();

        return Created("", ApiResponse.Success(banner, "Tạo banner thành công."));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] BannerRequest request)
    {
        var banner = await _db.Banners.FindAsync(id);
        if (banner is null)
            return NotFound(ApiResponse.Fail("Banner không tồn tại."));

        banner.Title = request.Title;
        banner.ImageUrl = request.ImageUrl;
        banner.LinkUrl = request.LinkUrl;
        banner.IsActive = request.IsActive;
        banner.SortOrder = request.SortOrder;
        banner.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Success(banner, "Cập nhật banner thành công."));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var banner = await _db.Banners.FindAsync(id);
        if (banner is null)
            return NotFound(ApiResponse.Fail("Banner không tồn tại."));

        _db.Banners.Remove(banner);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Success<object?>(null, "Đã xóa banner."));
    }
}

public class BannerRequest
{
    public string Title { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string? LinkUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; } = 0;
}

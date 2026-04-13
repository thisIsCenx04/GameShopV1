using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GameStore.API.DTOs.Common;
using GameStore.API.Models.Entities;
using GameStore.API.Repositories.Data;

namespace GameStore.API.Controllers.Admin;

/// <summary>
/// Admin CRUD for Game Categories (sub-categories within a game)
/// </summary>
[ApiController]
[Route("api/v1/admin/games/{gameId:int}/categories")]
[Authorize(Roles = "Admin")]
public class AdminGameCategoriesController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminGameCategoriesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll(int gameId)
    {
        var gameExists = await _db.Games.AnyAsync(g => g.Id == gameId);
        if (!gameExists) return NotFound(ApiResponse.Fail("Game không tồn tại."));

        var categories = await _db.GameCategories
            .Where(c => c.GameId == gameId)
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync();

        return Ok(ApiResponse.Success(categories));
    }

    [HttpPost]
    public async Task<IActionResult> Create(int gameId, [FromBody] GameCategoryRequest request)
    {
        var gameExists = await _db.Games.AnyAsync(g => g.Id == gameId);
        if (!gameExists) return NotFound(ApiResponse.Fail("Game không tồn tại."));

        var category = new GameCategory
        {
            GameId = gameId,
            Name = request.Name,
            Slug = request.Slug ?? CreateSlug(request.Name),
            CoverImageUrl = request.CoverImageUrl,
            Description = request.Description,
            IsActive = request.IsActive,
            DisplayOrder = request.DisplayOrder,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.GameCategories.Add(category);
        await _db.SaveChangesAsync();

        return Created("", ApiResponse.Success(category, "Tạo danh mục thành công."));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int gameId, int id, [FromBody] GameCategoryRequest request)
    {
        var category = await _db.GameCategories.FirstOrDefaultAsync(c => c.Id == id && c.GameId == gameId);
        if (category is null)
            return NotFound(ApiResponse.Fail("Danh mục không tồn tại."));

        category.Name = request.Name;
        category.Slug = request.Slug ?? CreateSlug(request.Name);
        category.CoverImageUrl = request.CoverImageUrl;
        category.Description = request.Description;
        category.IsActive = request.IsActive;
        category.DisplayOrder = request.DisplayOrder;
        category.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Success(category, "Cập nhật danh mục thành công."));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int gameId, int id)
    {
        var category = await _db.GameCategories.FirstOrDefaultAsync(c => c.Id == id && c.GameId == gameId);
        if (category is null)
            return NotFound(ApiResponse.Fail("Danh mục không tồn tại."));

        // Check for existing products
        var hasProducts = await _db.ProductListings.AnyAsync(p => p.GameCategoryId == id);
        if (hasProducts)
            return BadRequest(ApiResponse.Fail("Không thể xóa danh mục đang có sản phẩm. Vui lòng chuyển sản phẩm sang danh mục khác trước."));

        _db.GameCategories.Remove(category);
        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Success<object?>(null, "Đã xóa danh mục."));
    }
    
    private static string CreateSlug(string name)
    {
        return name.ToLower().Replace(" ", "-").Replace("đ", "d"); // Very basic, production needs proper diacritics removal
    }
}

public class GameCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; } = 0;
}

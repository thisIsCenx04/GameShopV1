using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GameStore.API.DTOs.Common;
using GameStore.API.DTOs.Games;
using GameStore.API.Models.Enums;
using GameStore.API.Repositories.Data;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Controllers;

/// <summary>
/// Public game catalog — danh sách games/ranks/servers cho form đăng sản phẩm
/// </summary>
[ApiController]
[Route("api/v1/games")]
public class GamesController : ControllerBase
{
    private readonly IGameService _gameService;
    private readonly AppDbContext _db;

    public GamesController(IGameService gameService, AppDbContext db)
    {
        _gameService = gameService;
        _db = db;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllGames()
    {
        var result = await _gameService.GetAllGamesAsync();
        return Ok(ApiResponse.Success(result));
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetGame(int id)
    {
        var result = await _gameService.GetGameByIdAsync(id);
        return Ok(ApiResponse.Success(result));
    }

    /// <summary>
    /// Danh mục con của một game — với số lượng sản phẩm trong mỗi danh mục
    /// </summary>
    [HttpGet("{gameId:int}/categories")]
    [AllowAnonymous]
    public async Task<IActionResult> GetGameCategories(int gameId)
    {
        var categories = await _db.GameCategories
            .Where(c => c.GameId == gameId && c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .Select(c => new
            {
                c.Id,
                c.GameId,
                c.Name,
                c.Slug,
                c.CoverImageUrl,
                c.Description,
                c.DisplayOrder,
                ProductCount = c.ProductListings.Count(p => p.Status == ProductStatus.Active),
                SoldCount = c.ProductListings.Count(p => p.Status == ProductStatus.Sold),
            })
            .ToListAsync();

        return Ok(ApiResponse.Success(categories));
    }
}


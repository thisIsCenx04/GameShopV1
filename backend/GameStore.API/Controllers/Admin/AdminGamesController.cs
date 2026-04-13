using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GameStore.API.DTOs.Common;
using GameStore.API.DTOs.Games;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Controllers.Admin;

/// <summary>
/// Admin game catalog management — CRUD games, ranks, servers
/// </summary>
[ApiController]
[Route("api/v1/admin/games")]
[Authorize(Roles = "Admin")]
public class AdminGamesController : ControllerBase
{
    private readonly IGameService _gameService;

    public AdminGamesController(IGameService gameService)
        => _gameService = gameService;

    [HttpPost]
    public async Task<IActionResult> CreateGame([FromBody] CreateGameRequest request)
    {
        var result = await _gameService.CreateGameAsync(request);
        return Created("", ApiResponse.Success(result, "Tạo game thành công."));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateGame(int id, [FromBody] UpdateGameRequest request)
    {
        var result = await _gameService.UpdateGameAsync(id, request);
        return Ok(ApiResponse.Success(result, "Cập nhật game thành công."));
    }

    [HttpPost("{gameId:int}/ranks")]
    public async Task<IActionResult> AddRank(int gameId, [FromBody] CreateGameRankRequest request)
    {
        var result = await _gameService.AddRankAsync(gameId, request);
        return Created("", ApiResponse.Success(result, "Thêm rank thành công."));
    }

    [HttpDelete("{gameId:int}/ranks/{rankId:int}")]
    public async Task<IActionResult> DeleteRank(int gameId, int rankId)
    {
        await _gameService.DeleteRankAsync(gameId, rankId);
        return Ok(ApiResponse.Success<object?>(null, "Đã xóa rank."));
    }

    [HttpPost("{gameId:int}/servers")]
    public async Task<IActionResult> AddServer(int gameId, [FromBody] CreateGameServerRequest request)
    {
        var result = await _gameService.AddServerAsync(gameId, request);
        return Created("", ApiResponse.Success(result, "Thêm server thành công."));
    }

    [HttpDelete("{gameId:int}/servers/{serverId:int}")]
    public async Task<IActionResult> DeleteServer(int gameId, int serverId)
    {
        await _gameService.DeleteServerAsync(gameId, serverId);
        return Ok(ApiResponse.Success<object?>(null, "Đã xóa server."));
    }
}

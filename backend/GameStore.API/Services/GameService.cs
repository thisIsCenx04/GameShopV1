using AutoMapper;
using Microsoft.EntityFrameworkCore;
using GameStore.API.DTOs.Games;
using GameStore.API.Exceptions;
using GameStore.API.Models.Entities;
using GameStore.API.Repositories.Data;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Services;

public class GameService : IGameService
{
    private readonly AppDbContext _ctx;
    private readonly IMapper _mapper;
    private readonly ILogger<GameService> _logger;

    public GameService(AppDbContext ctx, IMapper mapper, ILogger<GameService> logger)
    {
        _ctx = ctx;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<List<GameResponse>> GetAllGamesAsync()
    {
        var games = await _ctx.Games
            .Where(g => g.IsActive)
            .Include(g => g.GameRanks.OrderBy(r => r.Order))
            .Include(g => g.GameServers.Where(s => s.IsActive))
            .Include(g => g.GameCategories.Where(c => c.IsActive).OrderBy(c => c.DisplayOrder))
            .OrderBy(g => g.DisplayOrder)
            .AsSplitQuery()
            .ToListAsync();

        return _mapper.Map<List<GameResponse>>(games);
    }

    public async Task<GameResponse> GetGameByIdAsync(int id)
    {
        var game = await _ctx.Games
            .Include(g => g.GameRanks.OrderBy(r => r.Order))
            .Include(g => g.GameServers.Where(s => s.IsActive))
            .Include(g => g.GameCategories.Where(c => c.IsActive).OrderBy(c => c.DisplayOrder))
            .AsSplitQuery()
            .FirstOrDefaultAsync(g => g.Id == id)
            ?? throw new NotFoundException("Game không tồn tại.");

        return _mapper.Map<GameResponse>(game);
    }

    public async Task<GameResponse> CreateGameAsync(CreateGameRequest request)
    {
        if (await _ctx.Games.AnyAsync(g => g.Slug == request.Slug))
            throw new ConflictException("Slug đã tồn tại.");

        var game = new Game
        {
            Name = request.Name,
            Slug = request.Slug,
            IconUrl = request.IconUrl,
            DisplayOrder = request.DisplayOrder,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _ctx.Games.Add(game);
        await _ctx.SaveChangesAsync();

        _logger.LogInformation("Game created: {GameName} ({GameId})", game.Name, game.Id);

        return _mapper.Map<GameResponse>(game);
    }

    public async Task<GameResponse> UpdateGameAsync(int id, UpdateGameRequest request)
    {
        var game = await _ctx.Games
            .Include(g => g.GameRanks.OrderBy(r => r.Order))
            .Include(g => g.GameServers)
            .Include(g => g.GameCategories.OrderBy(c => c.DisplayOrder))
            .AsSplitQuery()
            .FirstOrDefaultAsync(g => g.Id == id)
            ?? throw new NotFoundException("Game không tồn tại.");

        if (request.Name != null) game.Name = request.Name;
        if (request.Slug != null)
        {
            if (await _ctx.Games.AnyAsync(g => g.Slug == request.Slug && g.Id != id))
                throw new ConflictException("Slug đã tồn tại.");
            game.Slug = request.Slug;
        }
        if (request.IconUrl != null) game.IconUrl = request.IconUrl;
        if (request.DisplayOrder.HasValue) game.DisplayOrder = request.DisplayOrder.Value;
        if (request.IsActive.HasValue) game.IsActive = request.IsActive.Value;

        game.UpdatedAt = DateTime.UtcNow;
        await _ctx.SaveChangesAsync();

        _logger.LogInformation("Game updated: {GameId}", id);

        return _mapper.Map<GameResponse>(game);
    }

    public async Task<GameRankResponse> AddRankAsync(int gameId, CreateGameRankRequest request)
    {
        if (!await _ctx.Games.AnyAsync(g => g.Id == gameId))
            throw new NotFoundException("Game không tồn tại.");

        var rank = new GameRank
        {
            GameId = gameId,
            Name = request.Name,
            IconUrl = request.IconUrl,
            Order = request.Order,
            CreatedAt = DateTime.UtcNow
        };

        _ctx.GameRanks.Add(rank);
        await _ctx.SaveChangesAsync();

        _logger.LogInformation("Rank added: {RankName} to Game {GameId}", rank.Name, gameId);

        return _mapper.Map<GameRankResponse>(rank);
    }

    public async Task<GameServerResponse> AddServerAsync(int gameId, CreateGameServerRequest request)
    {
        if (!await _ctx.Games.AnyAsync(g => g.Id == gameId))
            throw new NotFoundException("Game không tồn tại.");

        var server = new GameServer
        {
            GameId = gameId,
            Name = request.Name,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _ctx.GameServers.Add(server);
        await _ctx.SaveChangesAsync();

        _logger.LogInformation("Server added: {ServerName} to Game {GameId}", server.Name, gameId);

        return _mapper.Map<GameServerResponse>(server);
    }

    public async Task DeleteRankAsync(int gameId, int rankId)
    {
        var rank = await _ctx.GameRanks.FirstOrDefaultAsync(r => r.Id == rankId && r.GameId == gameId)
            ?? throw new NotFoundException("Rank không tồn tại.");

        _ctx.GameRanks.Remove(rank);
        await _ctx.SaveChangesAsync();

        _logger.LogInformation("Rank deleted: {RankId} from Game {GameId}", rankId, gameId);
    }

    public async Task DeleteServerAsync(int gameId, int serverId)
    {
        var server = await _ctx.GameServers.FirstOrDefaultAsync(s => s.Id == serverId && s.GameId == gameId)
            ?? throw new NotFoundException("Server không tồn tại.");

        _ctx.GameServers.Remove(server);
        await _ctx.SaveChangesAsync();

        _logger.LogInformation("Server deleted: {ServerId} from Game {GameId}", serverId, gameId);
    }
}

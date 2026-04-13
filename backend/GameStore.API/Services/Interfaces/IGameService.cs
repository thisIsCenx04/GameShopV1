using GameStore.API.DTOs.Games;

namespace GameStore.API.Services.Interfaces;

public interface IGameService
{
    Task<List<GameResponse>> GetAllGamesAsync();
    Task<GameResponse> GetGameByIdAsync(int id);
    Task<GameResponse> CreateGameAsync(CreateGameRequest request);
    Task<GameResponse> UpdateGameAsync(int id, UpdateGameRequest request);
    Task<GameRankResponse> AddRankAsync(int gameId, CreateGameRankRequest request);
    Task<GameServerResponse> AddServerAsync(int gameId, CreateGameServerRequest request);
    Task DeleteRankAsync(int gameId, int rankId);
    Task DeleteServerAsync(int gameId, int serverId);
}

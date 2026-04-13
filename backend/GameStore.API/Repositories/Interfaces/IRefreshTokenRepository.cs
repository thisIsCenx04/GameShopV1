using GameStore.API.Models.Entities;

namespace GameStore.API.Repositories.Interfaces;

public interface IRefreshTokenRepository : IGenericRepository<RefreshToken>
{
    Task<RefreshToken?> GetByTokenAsync(string token);
    Task RevokeAllByUserIdAsync(Guid userId);
}

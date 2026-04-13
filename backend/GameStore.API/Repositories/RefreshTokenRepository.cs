using Microsoft.EntityFrameworkCore;
using GameStore.API.Models.Entities;
using GameStore.API.Repositories.Data;
using GameStore.API.Repositories.Interfaces;

namespace GameStore.API.Repositories;

public class RefreshTokenRepository : GenericRepository<RefreshToken>, IRefreshTokenRepository
{
    public RefreshTokenRepository(AppDbContext ctx) : base(ctx) { }

    public async Task<RefreshToken?> GetByTokenAsync(string token)
        => await _dbSet.Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == token);

    public async Task RevokeAllByUserIdAsync(Guid userId)
    {
        var tokens = await _dbSet
            .Where(r => r.UserId == userId && r.RevokedAt == null)
            .ToListAsync();

        foreach (var token in tokens)
        {
            token.RevokedAt = DateTime.UtcNow;
        }
    }
}

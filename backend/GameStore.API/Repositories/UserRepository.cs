using Microsoft.EntityFrameworkCore;
using GameStore.API.Models.Entities;
using GameStore.API.Repositories.Data;
using GameStore.API.Repositories.Interfaces;

namespace GameStore.API.Repositories;

public class UserRepository : GenericRepository<User>, IUserRepository
{
    public UserRepository(AppDbContext ctx) : base(ctx) { }

    public async Task<User?> GetByEmailAsync(string email)
        => await _dbSet
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Email == email);

    public async Task<User?> GetByIdWithProfileAsync(Guid id)
        => await _dbSet
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == id);

    public async Task<User?> GetByIdWithDetailsAsync(Guid id)
        => await _dbSet
            .Include(u => u.Profile)
            .Include(u => u.CollaboratorContracts)
            .Include(u => u.InsuranceDeposits)
            .Include(u => u.CollaboratorStats)
            .FirstOrDefaultAsync(u => u.Id == id);

    public async Task<bool> EmailExistsAsync(string email)
        => await _dbSet.AnyAsync(u => u.Email == email);
}

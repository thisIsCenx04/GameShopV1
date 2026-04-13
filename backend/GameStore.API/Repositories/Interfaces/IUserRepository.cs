using GameStore.API.Models.Entities;

namespace GameStore.API.Repositories.Interfaces;

public interface IUserRepository : IGenericRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdWithProfileAsync(Guid id);
    Task<User?> GetByIdWithDetailsAsync(Guid id);
    Task<bool> EmailExistsAsync(string email);
}

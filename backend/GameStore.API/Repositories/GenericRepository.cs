using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using GameStore.API.Repositories.Data;

namespace GameStore.API.Repositories;

/// <summary>
/// Base class cho tất cả Repository implementations
/// </summary>
public class GenericRepository<T> : Interfaces.IGenericRepository<T> where T : class
{
    protected readonly AppDbContext _ctx;
    protected readonly DbSet<T> _dbSet;

    public GenericRepository(AppDbContext ctx)
    {
        _ctx = ctx;
        _dbSet = ctx.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(Guid id)
        => await _dbSet.FindAsync(id);

    public virtual async Task<T?> GetByIdAsync(int id)
        => await _dbSet.FindAsync(id);

    public virtual async Task<IEnumerable<T>> GetAllAsync()
        => await _dbSet.ToListAsync();

    public virtual async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
        => await _dbSet.Where(predicate).ToListAsync();

    public virtual async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        return entity;
    }

    public virtual void Update(T entity)
        => _dbSet.Update(entity);

    public virtual void Delete(T entity)
        => _dbSet.Remove(entity);

    public virtual async Task<int> SaveChangesAsync()
        => await _ctx.SaveChangesAsync();

    public virtual async Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate)
        => await _dbSet.AnyAsync(predicate);

    public virtual async Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null)
        => predicate == null ? await _dbSet.CountAsync() : await _dbSet.CountAsync(predicate);
}

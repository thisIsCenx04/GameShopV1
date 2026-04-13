using Microsoft.EntityFrameworkCore;
using GameStore.API.DTOs.Products;
using GameStore.API.Models.Constants;
using GameStore.API.Models.Entities;
using GameStore.API.Models.Enums;
using GameStore.API.Repositories.Data;
using GameStore.API.Repositories.Interfaces;

namespace GameStore.API.Repositories;

public class ProductRepository : GenericRepository<ProductListing>, IProductRepository
{
    public ProductRepository(AppDbContext context) : base(context) { }

    public async Task<ProductListing?> GetByIdWithDetailsAsync(Guid id)
    {
        return await _dbSet
            .Include(p => p.Collaborator).ThenInclude(u => u.Profile)
            .Include(p => p.Game)
            .Include(p => p.GameRank)
            .Include(p => p.GameServer)
            .Include(p => p.GameCategory)
            .Include(p => p.Images.OrderBy(i => i.SortOrder))
            .Include(p => p.ProductListingTags).ThenInclude(pt => pt.Tag)
            .AsSplitQuery()
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<ProductListing?> GetByIdForEditAsync(Guid id, Guid collaboratorId)
    {
        return await _dbSet
            .Include(p => p.Images)
            .Include(p => p.ProductListingTags)
            .FirstOrDefaultAsync(p => p.Id == id && p.CollaboratorId == collaboratorId);
    }

    public async Task<(List<ProductListing> Items, int TotalCount)> GetFilteredAsync(ProductFilterRequest filter)
    {
        var query = _dbSet
            .Include(p => p.Collaborator).ThenInclude(u => u.Profile)
            .Include(p => p.Game)
            .Include(p => p.GameRank)
            .Include(p => p.GameServer)
            .Include(p => p.GameCategory)
            .Include(p => p.Images.Where(i => i.IsMain))
            .Where(p => p.Status == ProductStatus.Active) // Only active for public view
            .AsQueryable();

        // Filters
        if (filter.GameId.HasValue)
            query = query.Where(p => p.GameId == filter.GameId.Value);

        if (filter.GameRankId.HasValue)
            query = query.Where(p => p.GameRankId == filter.GameRankId.Value);

        if (filter.GameServerId.HasValue)
            query = query.Where(p => p.GameServerId == filter.GameServerId.Value);

        if (filter.GameCategoryId.HasValue)
            query = query.Where(p => p.GameCategoryId == filter.GameCategoryId.Value);

        if (filter.MinPrice.HasValue)
            query = query.Where(p => p.Price >= filter.MinPrice.Value);

        if (filter.MaxPrice.HasValue)
            query = query.Where(p => p.Price <= filter.MaxPrice.Value);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(p => p.Title.ToLower().Contains(search));
        }

        if (filter.TagIds != null && filter.TagIds.Count > 0)
        {
            query = query.Where(p => p.ProductListingTags.Any(pt => filter.TagIds.Contains(pt.TagId)));
        }

        var totalCount = await query.CountAsync();

        // Sorting
        query = filter.SortBy?.ToLower() switch
        {
            "price_asc" => query.OrderBy(p => p.Price),
            "price_desc" => query.OrderByDescending(p => p.Price),
            "popular" => query.OrderByDescending(p => p.ViewCount),
            _ => query.OrderByDescending(p => p.CreatedAt) // "newest" default
        };

        // Pagination
        var pageSize = Math.Min(filter.PageSize, AppConstants.MAX_PAGE_SIZE);
        var items = await query
            .Skip((filter.Page - 1) * pageSize)
            .Take(pageSize)
            .AsSplitQuery()
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<(List<ProductListing> Items, int TotalCount)> GetByCollaboratorAsync(
        Guid collaboratorId, int page, int pageSize)
    {
        var query = _dbSet
            .Include(p => p.Game)
            .Include(p => p.GameRank)
            .Include(p => p.Images.Where(i => i.IsMain))
            .Where(p => p.CollaboratorId == collaboratorId)
            .OrderByDescending(p => p.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsSplitQuery()
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<(List<ProductListing> Items, int TotalCount)> GetPendingForAdminAsync(int page, int pageSize)
    {
        var query = _dbSet
            .Include(p => p.Collaborator).ThenInclude(u => u.Profile)
            .Include(p => p.Game)
            .Include(p => p.GameRank)
            .Include(p => p.Images.Where(i => i.IsMain))
            .Where(p => p.Status == ProductStatus.Pending)
            .OrderBy(p => p.CreatedAt); // Oldest first for FIFO review

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsSplitQuery()
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<(List<ProductListing> Items, int TotalCount)> GetAllForAdminAsync(
        int page, int pageSize, string? search)
    {
        var query = _dbSet
            .Include(p => p.Collaborator).ThenInclude(u => u.Profile)
            .Include(p => p.Game)
            .Include(p => p.GameRank)
            .Include(p => p.Images.Where(i => i.IsMain))
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(p => p.Title.ToLower().Contains(s)
                || (p.Collaborator.Profile != null && p.Collaborator.Profile.FullName!.ToLower().Contains(s)));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsSplitQuery()
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task IncrementViewCountAsync(Guid id)
    {
        await _dbSet
            .Where(p => p.Id == id)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.ViewCount, p => p.ViewCount + 1));
    }
}

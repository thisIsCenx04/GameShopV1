using GameStore.API.DTOs.Products;
using GameStore.API.Models.Entities;

namespace GameStore.API.Repositories.Interfaces;

public interface IProductRepository : IGenericRepository<ProductListing>
{
    Task<ProductListing?> GetByIdWithDetailsAsync(Guid id);
    Task<ProductListing?> GetByIdForEditAsync(Guid id, Guid collaboratorId);
    Task<(List<ProductListing> Items, int TotalCount)> GetFilteredAsync(ProductFilterRequest filter);
    Task<(List<ProductListing> Items, int TotalCount)> GetByCollaboratorAsync(Guid collaboratorId, int page, int pageSize);
    Task<(List<ProductListing> Items, int TotalCount)> GetPendingForAdminAsync(int page, int pageSize);
    Task<(List<ProductListing> Items, int TotalCount)> GetAllForAdminAsync(int page, int pageSize, string? search);
    Task IncrementViewCountAsync(Guid id);
}

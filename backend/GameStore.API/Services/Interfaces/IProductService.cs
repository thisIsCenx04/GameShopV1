using GameStore.API.DTOs.Common;
using GameStore.API.DTOs.Products;

namespace GameStore.API.Services.Interfaces;

public interface IProductService
{
    // Public
    Task<PagedResult<ProductListResponse>> GetProductsAsync(ProductFilterRequest filter);
    Task<ProductDetailResponse> GetProductDetailAsync(Guid id);

    // Collaborator
    Task<ProductDetailResponse> CreateProductAsync(Guid collaboratorId, CreateProductRequest request);
    Task<ProductDetailResponse> UpdateProductAsync(Guid collaboratorId, Guid productId, UpdateProductRequest request);
    Task SubmitForApprovalAsync(Guid collaboratorId, Guid productId);
    Task DeleteProductAsync(Guid collaboratorId, Guid productId);
    Task<PagedResult<ProductListResponse>> GetMyProductsAsync(Guid collaboratorId, int page, int pageSize);
    Task<ProductDetailResponse> GetMyProductDetailAsync(Guid collaboratorId, Guid productId);

    // Admin
    Task<PagedResult<ProductListResponse>> GetAllProductsForAdminAsync(int page, int pageSize, string? search);
    Task<PagedResult<ProductListResponse>> GetPendingProductsAsync(int page, int pageSize);
    Task ApproveProductAsync(Guid adminId, Guid productId);
    Task RejectProductAsync(Guid adminId, Guid productId, string? reason);
    Task ToggleFeaturedAsync(Guid productId);
    Task HideProductAsync(Guid productId);
    Task UnhideProductAsync(Guid productId);
    Task AdminDeleteProductAsync(Guid productId);
    Task<ProductDetailResponse> AdminCreateProductAsync(Guid adminId, CreateProductRequest request);
}

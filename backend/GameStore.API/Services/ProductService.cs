using AutoMapper;
using GameStore.API.DTOs.Common;
using GameStore.API.DTOs.Products;
using GameStore.API.Exceptions;
using GameStore.API.Models.Constants;
using GameStore.API.Models.Entities;
using GameStore.API.Models.Enums;
using GameStore.API.Repositories.Interfaces;
using GameStore.API.Services.Interfaces;
using GameStore.API.Extensions;

namespace GameStore.API.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _productRepo;
    private readonly IUserRepository _userRepo;
    private readonly IMapper _mapper;
    private readonly ILogger<ProductService> _logger;

    public ProductService(
        IProductRepository productRepo,
        IUserRepository userRepo,
        IMapper mapper,
        ILogger<ProductService> logger)
    {
        _productRepo = productRepo;
        _userRepo = userRepo;
        _mapper = mapper;
        _logger = logger;
    }

    // ==================== Public ====================

    public async Task<PagedResult<ProductListResponse>> GetProductsAsync(ProductFilterRequest filter)
    {
        var (items, total) = await _productRepo.GetFilteredAsync(filter);
        var mapped = _mapper.Map<List<ProductListResponse>>(items);
        return new PagedResult<ProductListResponse>(mapped, total, filter.Page, filter.PageSize);
    }

    public async Task<ProductDetailResponse> GetProductDetailAsync(Guid id)
    {
        var product = await _productRepo.GetByIdWithDetailsAsync(id)
            ?? throw new NotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);

        // Chỉ cho xem sản phẩm Active
        if (product.Status != ProductStatus.Active)
            throw new NotFoundException(ErrorMessages.PRODUCT_NOT_ACTIVE);

        // Tăng lượt xem
        await _productRepo.IncrementViewCountAsync(id);

        return _mapper.Map<ProductDetailResponse>(product);
    }

    // ==================== Collaborator ====================

    public async Task<ProductDetailResponse> CreateProductAsync(Guid collaboratorId, CreateProductRequest request)
    {
        // Verify user is Collaborator — RULE 05
        var user = await _userRepo.GetByIdAsync(collaboratorId)
            ?? throw new NotFoundException(ErrorMessages.NOT_FOUND);

        if (user.Role != UserRole.Collaborator && user.Role != UserRole.Admin)
            throw new ForbiddenException(ErrorMessages.NOT_COLLABORATOR);

        var product = new ProductListing
        {
            CollaboratorId = collaboratorId,
            GameId = request.GameId,
            GameRankId = request.GameRankId,
            GameServerId = request.GameServerId,
            GameCategoryId = request.GameCategoryId,
            Title = request.Title,
            Description = request.Description,
            Price = request.Price,
            Status = ProductStatus.Draft,
            EncryptedUsername = EncryptionHelper.Encrypt(request.AccountUsername),
            EncryptedPassword = EncryptionHelper.Encrypt(request.AccountPassword),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Images
        if (request.ImageUrls.Count > 0)
        {
            for (int i = 0; i < request.ImageUrls.Count; i++)
            {
                product.Images.Add(new ProductImage
                {
                    ImageUrl = request.ImageUrls[i],
                    SortOrder = i,
                    IsMain = i == 0, // First image is main
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        // Tags
        foreach (var tagId in request.TagIds)
        {
            product.ProductListingTags.Add(new ProductListingTag
            {
                TagId = tagId
            });
        }

        await _productRepo.AddAsync(product);
        await _productRepo.SaveChangesAsync();

        _logger.LogInformation("Product created: {ProductId} by Collaborator {CollaboratorId}", product.Id, collaboratorId);

        // Reload with details
        var created = await _productRepo.GetByIdWithDetailsAsync(product.Id);
        return _mapper.Map<ProductDetailResponse>(created!);
    }

    public async Task<ProductDetailResponse> UpdateProductAsync(
        Guid collaboratorId, Guid productId, UpdateProductRequest request)
    {
        var product = await _productRepo.GetByIdForEditAsync(productId, collaboratorId)
            ?? throw new NotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);

        // Chỉ cho sửa khi Draft hoặc bị Reject (chuyển về Draft)
        if (product.Status != ProductStatus.Draft)
            throw new BusinessException("Chỉ có thể chỉnh sửa sản phẩm ở trạng thái Nháp.");

        if (request.Title != null) product.Title = request.Title;
        if (request.Description != null) product.Description = request.Description;
        if (request.Price.HasValue) product.Price = request.Price.Value;
        if (request.GameRankId.HasValue) product.GameRankId = request.GameRankId.Value;
        if (request.GameServerId.HasValue) product.GameServerId = request.GameServerId.Value;
        if (!string.IsNullOrEmpty(request.AccountUsername)) product.EncryptedUsername = EncryptionHelper.Encrypt(request.AccountUsername);
        if (!string.IsNullOrEmpty(request.AccountPassword)) product.EncryptedPassword = EncryptionHelper.Encrypt(request.AccountPassword);

        // Replace images if provided
        if (request.ImageUrls != null)
        {
            product.Images.Clear();
            for (int i = 0; i < request.ImageUrls.Count; i++)
            {
                product.Images.Add(new ProductImage
                {
                    ImageUrl = request.ImageUrls[i],
                    SortOrder = i,
                    IsMain = i == 0,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        // Replace tags if provided
        if (request.TagIds != null)
        {
            product.ProductListingTags.Clear();
            foreach (var tagId in request.TagIds)
            {
                product.ProductListingTags.Add(new ProductListingTag { TagId = tagId });
            }
        }

        product.UpdatedAt = DateTime.UtcNow;
        await _productRepo.SaveChangesAsync();

        _logger.LogInformation("Product updated: {ProductId}", productId);

        var updated = await _productRepo.GetByIdWithDetailsAsync(productId);
        return _mapper.Map<ProductDetailResponse>(updated!);
    }

    public async Task SubmitForApprovalAsync(Guid collaboratorId, Guid productId)
    {
        var product = await _productRepo.GetByIdForEditAsync(productId, collaboratorId)
            ?? throw new NotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);

        if (product.Status != ProductStatus.Draft)
            throw new BusinessException("Chỉ có thể gửi duyệt sản phẩm ở trạng thái Nháp.");

        product.Status = ProductStatus.Pending;
        product.UpdatedAt = DateTime.UtcNow;

        await _productRepo.SaveChangesAsync();

        _logger.LogInformation("Product submitted for approval: {ProductId}", productId);
    }

    public async Task DeleteProductAsync(Guid collaboratorId, Guid productId)
    {
        var product = await _productRepo.GetByIdForEditAsync(productId, collaboratorId)
            ?? throw new NotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);

        if (product.Status == ProductStatus.Sold)
            throw new BusinessException("Không thể xóa sản phẩm đã bán.");

        _productRepo.Delete(product);
        await _productRepo.SaveChangesAsync();

        _logger.LogInformation("Product deleted: {ProductId}", productId);
    }

    public async Task<PagedResult<ProductListResponse>> GetMyProductsAsync(
        Guid collaboratorId, int page, int pageSize)
    {
        var (items, total) = await _productRepo.GetByCollaboratorAsync(collaboratorId, page, pageSize);
        var mapped = _mapper.Map<List<ProductListResponse>>(items);
        return new PagedResult<ProductListResponse>(mapped, total, page, pageSize);
    }

    public async Task<ProductDetailResponse> GetMyProductDetailAsync(Guid collaboratorId, Guid productId)
    {
        var product = await _productRepo.GetByIdWithDetailsAsync(productId)
            ?? throw new NotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);

        // Verify ownership
        if (product.CollaboratorId != collaboratorId)
            throw new ForbiddenException("Bạn không có quyền xem sản phẩm này.");

        return _mapper.Map<ProductDetailResponse>(product);
    }

    // ==================== Admin ====================

    public async Task<PagedResult<ProductListResponse>> GetAllProductsForAdminAsync(int page, int pageSize, string? search)
    {
        var (items, total) = await _productRepo.GetAllForAdminAsync(page, pageSize, search);
        var mapped = _mapper.Map<List<ProductListResponse>>(items);
        return new PagedResult<ProductListResponse>(mapped, total, page, pageSize);
    }

    public async Task AdminDeleteProductAsync(Guid productId)
    {
        var product = await _productRepo.GetByIdAsync(productId)
            ?? throw new NotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);

        if (product.Status == ProductStatus.Sold)
            throw new BusinessException("Không thể xóa sản phẩm đã bán.");

        _productRepo.Delete(product);
        await _productRepo.SaveChangesAsync();

        _logger.LogWarning("Product force-deleted by admin: {ProductId}", productId);
    }

    public async Task<PagedResult<ProductListResponse>> GetPendingProductsAsync(int page, int pageSize)
    {
        var (items, total) = await _productRepo.GetPendingForAdminAsync(page, pageSize);
        var mapped = _mapper.Map<List<ProductListResponse>>(items);
        return new PagedResult<ProductListResponse>(mapped, total, page, pageSize);
    }

    public async Task ApproveProductAsync(Guid adminId, Guid productId)
    {
        var product = await _productRepo.GetByIdAsync(productId)
            ?? throw new NotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);

        if (product.Status != ProductStatus.Pending)
            throw new BusinessException("Chỉ có thể duyệt sản phẩm ở trạng thái Chờ duyệt.");

        product.Status = ProductStatus.Active;
        product.ApprovedAt = DateTime.UtcNow;
        product.ApprovedById = adminId;
        product.UpdatedAt = DateTime.UtcNow;

        await _productRepo.SaveChangesAsync();

        _logger.LogInformation("Product approved: {ProductId} by Admin {AdminId}", productId, adminId);
    }

    public async Task RejectProductAsync(Guid adminId, Guid productId, string? reason)
    {
        var product = await _productRepo.GetByIdAsync(productId)
            ?? throw new NotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);

        if (product.Status != ProductStatus.Pending)
            throw new BusinessException("Chỉ có thể từ chối sản phẩm ở trạng thái Chờ duyệt.");

        // Set lại Draft để Collaborator có thể sửa và gửi lại
        product.Status = ProductStatus.Draft;
        product.UpdatedAt = DateTime.UtcNow;

        await _productRepo.SaveChangesAsync();

        _logger.LogInformation("Product rejected: {ProductId} by Admin {AdminId}. Reason: {Reason}",
            productId, adminId, reason ?? "N/A");
    }

    public async Task ToggleFeaturedAsync(Guid productId)
    {
        var product = await _productRepo.GetByIdAsync(productId)
            ?? throw new NotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);

        product.IsFeatured = !product.IsFeatured;
        product.UpdatedAt = DateTime.UtcNow;

        await _productRepo.SaveChangesAsync();

        _logger.LogInformation("Product featured toggled: {ProductId} -> {IsFeatured}", productId, product.IsFeatured);
    }

    public async Task HideProductAsync(Guid productId)
    {
        var product = await _productRepo.GetByIdAsync(productId)
            ?? throw new NotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);

        product.Status = ProductStatus.Hidden;
        product.UpdatedAt = DateTime.UtcNow;

        await _productRepo.SaveChangesAsync();

        _logger.LogWarning("Product hidden by admin: {ProductId}", productId);
    }

    public async Task UnhideProductAsync(Guid productId)
    {
        var product = await _productRepo.GetByIdAsync(productId)
            ?? throw new NotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);

        if (product.Status != ProductStatus.Hidden)
            throw new BusinessException("Sản phẩm không ở trạng thái bị ẩn.");

        product.Status = ProductStatus.Active;
        product.UpdatedAt = DateTime.UtcNow;

        await _productRepo.SaveChangesAsync();

        _logger.LogInformation("Product unhidden by admin: {ProductId}", productId);
    }

    public async Task<ProductDetailResponse> AdminCreateProductAsync(Guid adminId, CreateProductRequest request)
    {
        var product = new ProductListing
        {
            CollaboratorId = adminId,
            GameId = request.GameId,
            GameRankId = request.GameRankId,
            GameServerId = request.GameServerId,
            GameCategoryId = request.GameCategoryId,
            Title = request.Title,
            Description = request.Description,
            Price = request.Price,
            // Admin-created products are immediately Active — no approval needed
            Status = ProductStatus.Active,
            EncryptedUsername = EncryptionHelper.Encrypt(request.AccountUsername),
            EncryptedPassword = EncryptionHelper.Encrypt(request.AccountPassword),
            ApprovedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (request.ImageUrls.Count > 0)
        {
            for (int i = 0; i < request.ImageUrls.Count; i++)
            {
                product.Images.Add(new ProductImage
                {
                    ImageUrl = request.ImageUrls[i],
                    SortOrder = i,
                    IsMain = i == 0,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        foreach (var tagId in request.TagIds)
            product.ProductListingTags.Add(new ProductListingTag { TagId = tagId });

        await _productRepo.AddAsync(product);
        await _productRepo.SaveChangesAsync();

        _logger.LogInformation("Admin product created & auto-approved: {ProductId} by Admin {AdminId}", product.Id, adminId);

        var created = await _productRepo.GetByIdWithDetailsAsync(product.Id);
        return _mapper.Map<ProductDetailResponse>(created!);
    }
}

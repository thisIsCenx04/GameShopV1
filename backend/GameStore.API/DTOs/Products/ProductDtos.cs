namespace GameStore.API.DTOs.Products;

// ==================== Request DTOs ====================

public class CreateProductRequest
{
    public int GameId { get; set; }
    public int GameRankId { get; set; }
    public int? GameServerId { get; set; }
    public int GameCategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string AccountUsername { get; set; } = string.Empty;
    public string AccountPassword { get; set; } = string.Empty;
    public List<string> ImageUrls { get; set; } = new();
    public List<int> TagIds { get; set; } = new();
}

public class UpdateProductRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public decimal? Price { get; set; }
    public int? GameRankId { get; set; }
    public int? GameServerId { get; set; }
    public string? AccountUsername { get; set; }
    public string? AccountPassword { get; set; }
    public List<string>? ImageUrls { get; set; }
    public List<int>? TagIds { get; set; }
}

public class ProductFilterRequest
{
    public int? GameId { get; set; }
    public int? GameRankId { get; set; }
    public int? GameServerId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? Search { get; set; }
    public List<int>? TagIds { get; set; }
    public int? GameCategoryId { get; set; }
    public string? SortBy { get; set; } = "newest"; // newest, price_asc, price_desc, popular
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class AdminApproveRequest
{
    public string? AdminNote { get; set; }
}

// ==================== Response DTOs ====================

public class ProductListResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? MainImageUrl { get; set; }
    public string GameName { get; set; } = string.Empty;
    public string GameRankName { get; set; } = string.Empty;
    public string? GameServerName { get; set; }
    public int ViewCount { get; set; }
    public bool IsFeatured { get; set; }
    public string CollaboratorName { get; set; } = string.Empty;
    public string? GameCategoryName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ProductDetailResponse
{
    public Guid Id { get; set; }
    public Guid CollaboratorId { get; set; }
    public string CollaboratorName { get; set; } = string.Empty;
    public int GameId { get; set; }
    public string GameName { get; set; } = string.Empty;
    public int GameRankId { get; set; }
    public string GameRankName { get; set; } = string.Empty;
    public int? GameServerId { get; set; }
    public string? GameServerName { get; set; }
    public int? GameCategoryId { get; set; }
    public string? GameCategoryName { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string Status { get; set; } = string.Empty;
    public int ViewCount { get; set; }
    public bool IsFeatured { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<ProductImageDto> Images { get; set; } = new();
    public List<TagDto> Tags { get; set; } = new();
}

public class ProductImageDto
{
    public Guid Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsMain { get; set; }
}

public class TagDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
}

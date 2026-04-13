using GameStore.API.Models.Enums;

namespace GameStore.API.Models.Entities;

/// <summary>
/// Sản phẩm đăng bán - bảng trung tâm nhóm Catalog
/// </summary>
public class ProductListing
{
    public Guid Id { get; set; }
    public Guid CollaboratorId { get; set; }
    public int GameId { get; set; }
    public int GameRankId { get; set; }
    public int? GameServerId { get; set; }
    public int? GameCategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    
    // Account Credentials
    public string EncryptedUsername { get; set; } = string.Empty;
    public string EncryptedPassword { get; set; } = string.Empty;
    
    public ProductStatus Status { get; set; } = ProductStatus.Draft;
    public int ViewCount { get; set; } = 0;
    public bool IsFeatured { get; set; } = false;
    public DateTime? ApprovedAt { get; set; }
    public Guid? ApprovedById { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User Collaborator { get; set; } = null!;
    public User? ApprovedBy { get; set; }
    public Game Game { get; set; } = null!;
    public GameRank GameRank { get; set; } = null!;
    public GameServer? GameServer { get; set; }
    public GameCategory? GameCategory { get; set; }
    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    public ICollection<ProductListingTag> ProductListingTags { get; set; } = new List<ProductListingTag>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}

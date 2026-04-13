namespace GameStore.API.Models.Entities;

/// <summary>
/// Ảnh sản phẩm - nhóm Catalog
/// </summary>
public class ProductImage
{
    public Guid Id { get; set; }
    public Guid ListingId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public int SortOrder { get; set; } = 0;
    public bool IsMain { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ProductListing Listing { get; set; } = null!;
}

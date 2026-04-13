namespace GameStore.API.Models.Entities;

/// <summary>
/// Tag phân loại sản phẩm - nhóm Catalog
/// </summary>
public class Tag
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int? GameId { get; set; } // null = global tag
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Game? Game { get; set; }
    public ICollection<ProductListingTag> ProductListingTags { get; set; } = new List<ProductListingTag>();
}

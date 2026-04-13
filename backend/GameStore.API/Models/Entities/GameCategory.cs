namespace GameStore.API.Models.Entities;

/// <summary>
/// Danh mục con của một tựa game — ví dụ: "Acc Tự Chọn", "Acc Random 50K"
/// </summary>
public class GameCategory
{
    public int Id { get; set; }
    public int GameId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Game Game { get; set; } = null!;
    public ICollection<ProductListing> ProductListings { get; set; } = new List<ProductListing>();
}

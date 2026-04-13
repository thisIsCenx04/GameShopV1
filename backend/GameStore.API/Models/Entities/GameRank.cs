namespace GameStore.API.Models.Entities;

/// <summary>
/// Hạng tài khoản game - nhóm Catalog
/// </summary>
public class GameRank
{
    public int Id { get; set; }
    public int GameId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Order { get; set; } = 0;
    public string? IconUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Game Game { get; set; } = null!;
    public ICollection<ProductListing> ProductListings { get; set; } = new List<ProductListing>();
}

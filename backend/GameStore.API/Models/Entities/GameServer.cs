namespace GameStore.API.Models.Entities;

/// <summary>
/// Server game - nhóm Catalog
/// </summary>
public class GameServer
{
    public int Id { get; set; }
    public int GameId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Game Game { get; set; } = null!;
    public ICollection<ProductListing> ProductListings { get; set; } = new List<ProductListing>();
}

namespace GameStore.API.Models.Entities;

/// <summary>
/// Tựa game - nhóm Catalog
/// </summary>
public class Game
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<GameRank> GameRanks { get; set; } = new List<GameRank>();
    public ICollection<GameServer> GameServers { get; set; } = new List<GameServer>();
    public ICollection<GameCategory> GameCategories { get; set; } = new List<GameCategory>();
    public ICollection<Tag> Tags { get; set; } = new List<Tag>();
    public ICollection<ProductListing> ProductListings { get; set; } = new List<ProductListing>();
}

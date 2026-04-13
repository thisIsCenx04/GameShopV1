namespace GameStore.API.Models.Entities;

/// <summary>
/// Quan hệ n-n ProductListings ↔ Tags - nhóm Catalog
/// </summary>
public class ProductListingTag
{
    public Guid ListingId { get; set; }
    public int TagId { get; set; }

    // Navigation properties
    public ProductListing Listing { get; set; } = null!;
    public Tag Tag { get; set; } = null!;
}

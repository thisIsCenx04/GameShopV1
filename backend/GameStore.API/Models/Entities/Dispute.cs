namespace GameStore.API.Models.Entities;

/// <summary>
/// Khiếu nại đơn hàng - nhóm Transaction
/// </summary>
public class Dispute
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Guid ReporterId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "Open"; // Open, UnderReview, Resolved, Rejected
    public string? AdminNote { get; set; }
    public string? Resolution { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Order Order { get; set; } = null!;
    public User Reporter { get; set; } = null!;
    public ICollection<DisputeAttachment> Attachments { get; set; } = new List<DisputeAttachment>();
}

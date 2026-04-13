namespace GameStore.API.Models.Entities;

/// <summary>
/// Đánh giá đơn hàng - nhóm Social
/// </summary>
public class Review
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Guid ReviewerId { get; set; }
    public int Rating { get; set; } // 1-5
    public string? Comment { get; set; }
    public bool IsVisible { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Order Order { get; set; } = null!;
    public User Reviewer { get; set; } = null!;
}

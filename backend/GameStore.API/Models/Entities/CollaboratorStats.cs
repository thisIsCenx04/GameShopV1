namespace GameStore.API.Models.Entities;

/// <summary>
/// Thống kê tổng hợp Collaborator (denormalized, cập nhật qua Background Job) - nhóm Social
/// </summary>
public class CollaboratorStats
{
    public Guid UserId { get; set; }
    public int TotalSold { get; set; } = 0;
    public decimal AvgRating { get; set; } = 0;
    public decimal DisputeRate { get; set; } = 0;
    public decimal ReputationScore { get; set; } = 0;
    public string BadgeLevel { get; set; } = "New"; // New, Trusted, HighReputation, TopSeller
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
}

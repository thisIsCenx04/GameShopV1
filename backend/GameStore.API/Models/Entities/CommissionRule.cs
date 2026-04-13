namespace GameStore.API.Models.Entities;

/// <summary>
/// Cấu hình hoa hồng linh hoạt - nhóm Finance
/// Priority: Collaborator cụ thể (1) > Game cụ thể (5) > Mặc định (10)
/// </summary>
public class CommissionRule
{
    public int Id { get; set; }
    public int? GameId { get; set; } // null = áp dụng mọi game
    public Guid? CollaboratorId { get; set; } // null = áp dụng mọi Collaborator
    public decimal AdminFeeRate { get; set; } // Ví dụ: 0.1500 = 15%
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; } // null = vô thời hạn
    public int Priority { get; set; } // Collaborator(1) > Game(5) > Default(10)
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Game? Game { get; set; }
    public User? Collaborator { get; set; }
}

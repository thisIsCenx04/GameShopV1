namespace GameStore.API.Models.Entities;

/// <summary>
/// Sổ cái hoa hồng - nhóm Finance
/// </summary>
public class CommissionLedger
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Guid CollaboratorId { get; set; }
    public decimal AdminFee { get; set; }
    public decimal CollaboratorEarning { get; set; }
    public decimal Rate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Order Order { get; set; } = null!;
    public User Collaborator { get; set; } = null!;
}

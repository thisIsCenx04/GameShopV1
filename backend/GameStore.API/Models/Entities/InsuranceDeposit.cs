using GameStore.API.Models.Enums;

namespace GameStore.API.Models.Entities;

/// <summary>
/// Phí bảo hiểm Collaborator - nhóm Finance
/// </summary>
public class InsuranceDeposit
{
    public Guid Id { get; set; }
    public Guid CollaboratorId { get; set; }
    public decimal Amount { get; set; }
    public InsuranceDepositStatus Status { get; set; } = InsuranceDepositStatus.Held;
    public string? AdminNote { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }

    // Navigation properties
    public User Collaborator { get; set; } = null!;
}

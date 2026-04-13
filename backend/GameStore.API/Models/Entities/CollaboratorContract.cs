using GameStore.API.Models.Enums;

namespace GameStore.API.Models.Entities;

/// <summary>
/// Hợp đồng Collaborator - nhóm Finance
/// </summary>
public class CollaboratorContract
{
    public Guid Id { get; set; }
    public Guid CollaboratorId { get; set; }
    public decimal AdminFeeRate { get; set; }
    public decimal InsuranceAmount { get; set; }
    public CollaboratorContractStatus ContractStatus { get; set; } = CollaboratorContractStatus.Active;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? AdminNote { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User Collaborator { get; set; } = null!;
}

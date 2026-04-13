using GameStore.API.Models.Enums;

namespace GameStore.API.Models.Entities;

/// <summary>
/// Lịch sử giao dịch ví - nhóm Finance
/// </summary>
public class WalletTransaction
{
    public Guid Id { get; set; }
    public Guid WalletId { get; set; }
    public WalletTransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public string? RefId { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Wallet Wallet { get; set; } = null!;
}

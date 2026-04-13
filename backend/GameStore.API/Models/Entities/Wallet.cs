namespace GameStore.API.Models.Entities;

/// <summary>
/// Ví nội bộ - nhóm Finance
/// </summary>
public class Wallet
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public decimal Balance { get; set; } = 0;
    public decimal FrozenBalance { get; set; } = 0;
    public string Currency { get; set; } = "VND";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<WalletTransaction> Transactions { get; set; } = new List<WalletTransaction>();
}

namespace GameStore.API.Models.Entities;

/// <summary>
/// Yêu cầu rút tiền - nhóm Finance
/// </summary>
public class WithdrawRequest
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string AccountHolder { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected, Completed
    public DateTime? ProcessedAt { get; set; }
    public string? AdminNote { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
}

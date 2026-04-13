namespace GameStore.API.Models.Entities;

/// <summary>
/// Yêu cầu nạp tiền - nhóm Finance
/// </summary>
public class PaymentRequest
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Provider { get; set; } = string.Empty; // momo, vnpay, banking
    public decimal Amount { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Completed, Failed
    public string? ProviderRef { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
}

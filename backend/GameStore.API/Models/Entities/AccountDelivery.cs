namespace GameStore.API.Models.Entities;

/// <summary>
/// Thông tin tài khoản bàn giao (mã hóa AES-256-GCM) - nhóm Transaction
/// </summary>
public class AccountDelivery
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string EncryptedUsername { get; set; } = string.Empty;
    public string EncryptedPassword { get; set; } = string.Empty;
    public string? EncryptedNotes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Order Order { get; set; } = null!;
}

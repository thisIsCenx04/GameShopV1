namespace GameStore.API.Models.Entities;

/// <summary>
/// Mã OTP xác thực - nhóm Auth
/// </summary>
public class OtpCode
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty; // "register", "reset"
    public DateTime ExpiresAt { get; set; }
    public DateTime? UsedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsUsed => UsedAt != null;

    // Navigation properties
    public User User { get; set; } = null!;
}

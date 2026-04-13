namespace GameStore.API.Models.Entities;

/// <summary>
/// Thông tin cá nhân user - nhóm Auth
/// </summary>
public class UserProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string? FullName { get; set; }
    public string? AvatarUrl { get; set; }
    public string? PhoneNumber { get; set; }
    public string? BankAccountName { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
}

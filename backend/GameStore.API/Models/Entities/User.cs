using GameStore.API.Models.Enums;

namespace GameStore.API.Models.Entities;

/// <summary>
/// Tài khoản hệ thống - nhóm Auth
/// </summary>
public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Customer;
    public bool IsActive { get; set; } = true;
    public bool EmailConfirmed { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public UserProfile? Profile { get; set; }
    public Wallet? Wallet { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<OtpCode> OtpCodes { get; set; } = new List<OtpCode>();
    public ICollection<ProductListing> ProductListings { get; set; } = new List<ProductListing>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<CollaboratorContract> CollaboratorContracts { get; set; } = new List<CollaboratorContract>();
    public ICollection<InsuranceDeposit> InsuranceDeposits { get; set; } = new List<InsuranceDeposit>();
    public CollaboratorStats? CollaboratorStats { get; set; }
}

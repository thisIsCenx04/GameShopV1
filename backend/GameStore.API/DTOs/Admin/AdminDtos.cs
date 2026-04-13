namespace GameStore.API.DTOs.Admin;

public class GrantCollaboratorRequest
{
    public decimal AdminFeeRate { get; set; }
    public decimal InsuranceAmount { get; set; }
    public string? AdminNote { get; set; }
}

// ============ Admin User Detail ============
public class AdminUserDetailResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? AvatarUrl { get; set; }
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; }
    public bool EmailConfirmed { get; set; }
    public DateTime CreatedAt { get; set; }

    // Wallet
    public decimal WalletBalance { get; set; }
    public decimal WalletFrozenBalance { get; set; }
    public decimal WalletAvailableBalance => WalletBalance - WalletFrozenBalance;

    // Collaborator-specific
    public decimal? AdminFeeRate { get; set; }
    public decimal? InsuranceAmount { get; set; }
    public string? ContractStatus { get; set; }

    // Bank info
    public string? BankName { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankAccountName { get; set; }

    // Collaborator stats
    public int? TotalSold { get; set; }
    public decimal? AvgRating { get; set; }
    public string? BadgeLevel { get; set; }
}

// ============ Admin Update User ============
public class AdminUpdateUserRequest
{
    public string? FullName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }
    public string? BankName { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankAccountName { get; set; }

    // Collaborator commission (only applies to Collaborator role)
    public decimal? AdminFeeRate { get; set; }
}

// ============ Change Role ============
public class ChangeUserRoleRequest
{
    public string Role { get; set; } = string.Empty; // "Customer", "Collaborator"

    // Only required when promoting to Collaborator
    public decimal? AdminFeeRate { get; set; }
    public decimal? InsuranceAmount { get; set; }
    public string? AdminNote { get; set; }
}

// ============ Wallet Adjustment ============
public class AdminAdjustWalletRequest
{
    /// <summary>
    /// Positive = credit, Negative = debit
    /// </summary>
    public decimal Amount { get; set; }
    public string Note { get; set; } = string.Empty;
}

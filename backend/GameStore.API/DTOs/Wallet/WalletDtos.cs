namespace GameStore.API.DTOs.Wallet;

public class WalletResponse
{
    public Guid Id { get; set; }
    public decimal Balance { get; set; }
    public decimal FrozenBalance { get; set; }
    public decimal AvailableBalance => Balance - FrozenBalance;
    public string Currency { get; set; } = "VND";
}

public class WalletTransactionResponse
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public string? RefId { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class DepositRequest
{
    public decimal Amount { get; set; }
    public string? Note { get; set; }
}

public class WithdrawRequestDto
{
    public decimal Amount { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string AccountHolder { get; set; } = string.Empty;
}

public class WithdrawResponse
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string AccountHolder { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? ProcessedAt { get; set; }
    public string? AdminNote { get; set; }
    public DateTime CreatedAt { get; set; }
}

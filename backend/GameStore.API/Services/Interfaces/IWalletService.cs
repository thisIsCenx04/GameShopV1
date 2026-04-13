using GameStore.API.DTOs.Common;
using GameStore.API.DTOs.Wallet;

namespace GameStore.API.Services.Interfaces;

public interface IWalletService
{
    Task<WalletResponse> GetWalletAsync(Guid userId);
    Task<PagedResult<WalletTransactionResponse>> GetTransactionsAsync(Guid userId, int page, int pageSize);
    Task<WalletResponse> DepositAsync(Guid userId, DepositRequest request);
    Task<WithdrawResponse> RequestWithdrawAsync(Guid userId, WithdrawRequestDto request);
    Task<PagedResult<WithdrawResponse>> GetMyWithdrawsAsync(Guid userId, int page, int pageSize);
    // Admin
    Task<PagedResult<WithdrawResponse>> GetPendingWithdrawsAsync(int page, int pageSize);
    Task ApproveWithdrawAsync(Guid adminId, Guid withdrawId);
    Task RejectWithdrawAsync(Guid adminId, Guid withdrawId, string? reason);
}

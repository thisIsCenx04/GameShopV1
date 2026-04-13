using Microsoft.EntityFrameworkCore;
using GameStore.API.DTOs.Common;
using GameStore.API.DTOs.Wallet;
using GameStore.API.Exceptions;
using GameStore.API.Models.Constants;
using GameStore.API.Models.Entities;
using GameStore.API.Models.Enums;
using GameStore.API.Repositories.Data;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Services;

public class WalletService : IWalletService
{
    private readonly AppDbContext _ctx;
    private readonly ILogger<WalletService> _logger;

    public WalletService(AppDbContext ctx, ILogger<WalletService> logger)
    {
        _ctx = ctx;
        _logger = logger;
    }

    public async Task<WalletResponse> GetWalletAsync(Guid userId)
    {
        var wallet = await _ctx.Wallets.FirstOrDefaultAsync(w => w.UserId == userId)
            ?? throw new NotFoundException(ErrorMessages.WALLET_NOT_FOUND);

        return new WalletResponse
        {
            Id = wallet.Id,
            Balance = wallet.Balance,
            FrozenBalance = wallet.FrozenBalance,
            Currency = wallet.Currency
        };
    }

    public async Task<PagedResult<WalletTransactionResponse>> GetTransactionsAsync(
        Guid userId, int page, int pageSize)
    {
        var wallet = await _ctx.Wallets.FirstOrDefaultAsync(w => w.UserId == userId)
            ?? throw new NotFoundException(ErrorMessages.WALLET_NOT_FOUND);

        var query = _ctx.WalletTransactions
            .Where(t => t.WalletId == wallet.Id)
            .OrderByDescending(t => t.CreatedAt);

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        var mapped = items.Select(t => new WalletTransactionResponse
        {
            Id = t.Id,
            Type = t.Type.ToString(),
            Amount = t.Amount,
            BalanceAfter = t.BalanceAfter,
            RefId = t.RefId,
            Note = t.Note,
            CreatedAt = t.CreatedAt
        }).ToList();

        return new PagedResult<WalletTransactionResponse>(mapped, total, page, pageSize);
    }

    /// <summary>
    /// Nạp tiền vào ví (MVP: trực tiếp, production: qua payment gateway)
    /// </summary>
    public async Task<WalletResponse> DepositAsync(Guid userId, DepositRequest request)
    {
        var wallet = await _ctx.Wallets.FirstOrDefaultAsync(w => w.UserId == userId)
            ?? throw new NotFoundException(ErrorMessages.WALLET_NOT_FOUND);

        wallet.Balance += request.Amount;
        wallet.UpdatedAt = DateTime.UtcNow;

        _ctx.WalletTransactions.Add(new WalletTransaction
        {
            WalletId = wallet.Id,
            Type = WalletTransactionType.Deposit,
            Amount = request.Amount,
            BalanceAfter = wallet.Balance,
            Note = request.Note ?? "Nạp tiền vào ví",
            CreatedAt = DateTime.UtcNow
        });

        await _ctx.SaveChangesAsync();

        _logger.LogInformation("Wallet deposit: {UserId} +{Amount}", userId, request.Amount);

        return new WalletResponse
        {
            Id = wallet.Id,
            Balance = wallet.Balance,
            FrozenBalance = wallet.FrozenBalance,
            Currency = wallet.Currency
        };
    }

    public async Task<WithdrawResponse> RequestWithdrawAsync(Guid userId, WithdrawRequestDto request)
    {
        var wallet = await _ctx.Wallets.FirstOrDefaultAsync(w => w.UserId == userId)
            ?? throw new NotFoundException(ErrorMessages.WALLET_NOT_FOUND);

        if (request.Amount < 100000)
            throw new BusinessException(ErrorMessages.MIN_WITHDRAW_AMOUNT);

        var available = wallet.Balance - wallet.FrozenBalance;
        if (available < request.Amount)
            throw new BusinessException(ErrorMessages.INSUFFICIENT_BALANCE);

        // Kiểm tra có yêu cầu rút đang pending không
        if (await _ctx.WithdrawRequests.AnyAsync(w => w.UserId == userId && w.Status == "Pending"))
            throw new BusinessException(ErrorMessages.PENDING_WITHDRAW_EXISTS);

        // Freeze tiền
        wallet.FrozenBalance += request.Amount;
        wallet.UpdatedAt = DateTime.UtcNow;

        var withdraw = new WithdrawRequest
        {
            UserId = userId,
            BankName = request.BankName,
            AccountNumber = request.AccountNumber,
            AccountHolder = request.AccountHolder,
            Amount = request.Amount,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _ctx.WithdrawRequests.Add(withdraw);

        _ctx.WalletTransactions.Add(new WalletTransaction
        {
            WalletId = wallet.Id,
            Type = WalletTransactionType.Freeze,
            Amount = -request.Amount,
            BalanceAfter = wallet.Balance,
            Note = "Đóng băng cho yêu cầu rút tiền",
            CreatedAt = DateTime.UtcNow
        });

        await _ctx.SaveChangesAsync();

        _logger.LogInformation("Withdraw requested: {UserId} amount {Amount}", userId, request.Amount);

        return MapWithdraw(withdraw);
    }

    public async Task<PagedResult<WithdrawResponse>> GetMyWithdrawsAsync(Guid userId, int page, int pageSize)
    {
        var query = _ctx.WithdrawRequests
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.CreatedAt);

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<WithdrawResponse>(items.Select(MapWithdraw).ToList(), total, page, pageSize);
    }

    public async Task<PagedResult<WithdrawResponse>> GetPendingWithdrawsAsync(int page, int pageSize)
    {
        var query = _ctx.WithdrawRequests
            .Where(w => w.Status == "Pending")
            .OrderBy(w => w.CreatedAt);

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<WithdrawResponse>(items.Select(MapWithdraw).ToList(), total, page, pageSize);
    }

    public async Task ApproveWithdrawAsync(Guid adminId, Guid withdrawId)
    {
        var withdraw = await _ctx.WithdrawRequests.FirstOrDefaultAsync(w => w.Id == withdrawId)
            ?? throw new NotFoundException("Yêu cầu rút tiền không tồn tại.");

        if (withdraw.Status != "Pending")
            throw new BusinessException("Yêu cầu không ở trạng thái chờ.");

        var wallet = await _ctx.Wallets.FirstOrDefaultAsync(w => w.UserId == withdraw.UserId)
            ?? throw new NotFoundException(ErrorMessages.WALLET_NOT_FOUND);

        wallet.Balance -= withdraw.Amount;
        wallet.FrozenBalance -= withdraw.Amount;
        wallet.UpdatedAt = DateTime.UtcNow;

        _ctx.WalletTransactions.Add(new WalletTransaction
        {
            WalletId = wallet.Id,
            Type = WalletTransactionType.Withdraw,
            Amount = -withdraw.Amount,
            BalanceAfter = wallet.Balance,
            Note = $"Rút tiền: {withdraw.BankName} - {withdraw.AccountNumber}",
            CreatedAt = DateTime.UtcNow
        });

        withdraw.Status = "Completed";
        withdraw.ProcessedAt = DateTime.UtcNow;
        withdraw.UpdatedAt = DateTime.UtcNow;

        await _ctx.SaveChangesAsync();

        _logger.LogInformation("Withdraw approved: {WithdrawId} by Admin {AdminId}", withdrawId, adminId);
    }

    public async Task RejectWithdrawAsync(Guid adminId, Guid withdrawId, string? reason)
    {
        var withdraw = await _ctx.WithdrawRequests.FirstOrDefaultAsync(w => w.Id == withdrawId)
            ?? throw new NotFoundException("Yêu cầu rút tiền không tồn tại.");

        if (withdraw.Status != "Pending")
            throw new BusinessException("Yêu cầu không ở trạng thái chờ.");

        var wallet = await _ctx.Wallets.FirstOrDefaultAsync(w => w.UserId == withdraw.UserId)!;
        wallet!.FrozenBalance -= withdraw.Amount;
        wallet.UpdatedAt = DateTime.UtcNow;

        _ctx.WalletTransactions.Add(new WalletTransaction
        {
            WalletId = wallet.Id,
            Type = WalletTransactionType.Unfreeze,
            Amount = withdraw.Amount,
            BalanceAfter = wallet.Balance,
            Note = "Hủy đóng băng: yêu cầu rút tiền bị từ chối",
            CreatedAt = DateTime.UtcNow
        });

        withdraw.Status = "Rejected";
        withdraw.AdminNote = reason;
        withdraw.ProcessedAt = DateTime.UtcNow;
        withdraw.UpdatedAt = DateTime.UtcNow;

        await _ctx.SaveChangesAsync();

        _logger.LogInformation("Withdraw rejected: {WithdrawId} by Admin {AdminId}", withdrawId, adminId);
    }

    private static WithdrawResponse MapWithdraw(WithdrawRequest w) => new()
    {
        Id = w.Id,
        Amount = w.Amount,
        BankName = w.BankName,
        AccountNumber = w.AccountNumber,
        AccountHolder = w.AccountHolder,
        Status = w.Status,
        ProcessedAt = w.ProcessedAt,
        AdminNote = w.AdminNote,
        CreatedAt = w.CreatedAt
    };
}

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using GameStore.API.DTOs.Admin;
using GameStore.API.DTOs.Common;
using GameStore.API.DTOs.Users;
using GameStore.API.Exceptions;
using GameStore.API.Models.Constants;
using GameStore.API.Models.Entities;
using GameStore.API.Models.Enums;
using GameStore.API.Repositories.Data;
using GameStore.API.Repositories.Interfaces;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepo;
    private readonly IMapper _mapper;
    private readonly AppDbContext _ctx; // Used only via repository for paged queries
    private readonly ILogger<UserService> _logger;

    public UserService(IUserRepository userRepo, IMapper mapper, AppDbContext ctx, ILogger<UserService> logger)
    {
        _userRepo = userRepo;
        _mapper = mapper;
        _ctx = ctx;
        _logger = logger;
    }

    public async Task<UserProfileResponse> GetProfileAsync(Guid userId)
    {
        var user = await _userRepo.GetByIdWithProfileAsync(userId)
            ?? throw new NotFoundException(ErrorMessages.NOT_FOUND);

        return _mapper.Map<UserProfileResponse>(user);
    }

    public async Task<UserProfileResponse> UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
    {
        var user = await _userRepo.GetByIdWithProfileAsync(userId)
            ?? throw new NotFoundException(ErrorMessages.NOT_FOUND);

        if (user.Profile == null)
        {
            user.Profile = new UserProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };
        }

        if (request.FullName != null) user.Profile.FullName = request.FullName;
        if (request.PhoneNumber != null) user.Profile.PhoneNumber = request.PhoneNumber;
        if (request.AvatarUrl != null) user.Profile.AvatarUrl = request.AvatarUrl;
        if (request.BankAccountName != null) user.Profile.BankAccountName = request.BankAccountName;
        if (request.BankAccountNumber != null) user.Profile.BankAccountNumber = request.BankAccountNumber;
        if (request.BankName != null) user.Profile.BankName = request.BankName;

        user.Profile.UpdatedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepo.SaveChangesAsync();

        return _mapper.Map<UserProfileResponse>(user);
    }

    public async Task<PagedResult<UserListResponse>> GetUsersAsync(int page, int pageSize)
    {
        var query = _ctx.Users.Include(u => u.Profile).AsQueryable();

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var mapped = _mapper.Map<List<UserListResponse>>(items);
        return new PagedResult<UserListResponse>(mapped, total, page, pageSize);
    }

    // ==================== Admin-specific ====================

    public async Task<AdminUserDetailResponse> GetUserDetailForAdminAsync(Guid userId)
    {
        var user = await _ctx.Users
            .Include(u => u.Profile)
            .Include(u => u.Wallet)
            .Include(u => u.CollaboratorContracts)
            .Include(u => u.CollaboratorStats)
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new NotFoundException("Người dùng không tồn tại.");

        var activeContract = user.CollaboratorContracts
            .FirstOrDefault(c => c.ContractStatus == CollaboratorContractStatus.Active);

        return new AdminUserDetailResponse
        {
            Id = user.Id,
            Email = user.Email,
            Role = user.Role.ToString(),
            FullName = user.Profile?.FullName,
            AvatarUrl = user.Profile?.AvatarUrl,
            PhoneNumber = user.Profile?.PhoneNumber,
            IsActive = user.IsActive,
            EmailConfirmed = user.EmailConfirmed,
            CreatedAt = user.CreatedAt,

            // Wallet
            WalletBalance = user.Wallet?.Balance ?? 0,
            WalletFrozenBalance = user.Wallet?.FrozenBalance ?? 0,

            // Collaborator contract
            AdminFeeRate = activeContract?.AdminFeeRate,
            InsuranceAmount = activeContract?.InsuranceAmount,
            ContractStatus = activeContract?.ContractStatus.ToString(),

            // Bank
            BankName = user.Profile?.BankName,
            BankAccountNumber = user.Profile?.BankAccountNumber,
            BankAccountName = user.Profile?.BankAccountName,

            // Stats
            TotalSold = user.CollaboratorStats?.TotalSold,
            AvgRating = user.CollaboratorStats?.AvgRating,
            BadgeLevel = user.CollaboratorStats?.BadgeLevel,
        };
    }

    public async Task<AdminUserDetailResponse> AdminUpdateUserAsync(Guid userId, AdminUpdateUserRequest request)
    {
        var user = await _ctx.Users
            .Include(u => u.Profile)
            .Include(u => u.CollaboratorContracts)
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new NotFoundException("Người dùng không tồn tại.");

        if (user.Profile == null)
        {
            user.Profile = new UserProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };
        }

        // Update profile fields
        if (request.FullName != null) user.Profile.FullName = request.FullName;
        if (request.PhoneNumber != null) user.Profile.PhoneNumber = request.PhoneNumber;
        if (request.AvatarUrl != null) user.Profile.AvatarUrl = request.AvatarUrl;
        if (request.BankName != null) user.Profile.BankName = request.BankName;
        if (request.BankAccountNumber != null) user.Profile.BankAccountNumber = request.BankAccountNumber;
        if (request.BankAccountName != null) user.Profile.BankAccountName = request.BankAccountName;

        user.Profile.UpdatedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;

        // Update commission rate if user is Collaborator and fee rate provided
        if (request.AdminFeeRate.HasValue && user.Role == UserRole.Collaborator)
        {
            var activeContract = user.CollaboratorContracts
                .FirstOrDefault(c => c.ContractStatus == CollaboratorContractStatus.Active);

            if (activeContract != null)
            {
                activeContract.AdminFeeRate = request.AdminFeeRate.Value;
                activeContract.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _ctx.SaveChangesAsync();

        _logger.LogInformation("Admin updated user {UserId}", userId);

        return await GetUserDetailForAdminAsync(userId);
    }

    public async Task AdjustWalletAsync(Guid adminId, Guid userId, AdminAdjustWalletRequest request)
    {
        if (request.Amount == 0)
            throw new BusinessException("Số tiền điều chỉnh không được bằng 0.");

        if (string.IsNullOrWhiteSpace(request.Note))
            throw new BusinessException("Ghi chú là bắt buộc khi điều chỉnh ví.");

        var wallet = await _ctx.Wallets.FirstOrDefaultAsync(w => w.UserId == userId)
            ?? throw new NotFoundException("Ví không tồn tại cho người dùng này.");

        // Check balance when deducting
        if (request.Amount < 0)
        {
            var available = wallet.Balance - wallet.FrozenBalance;
            if (available < Math.Abs(request.Amount))
                throw new BusinessException($"Số dư khả dụng không đủ. Hiện có: {available:N0} VND.");
        }

        wallet.Balance += request.Amount;
        wallet.UpdatedAt = DateTime.UtcNow;

        var txType = request.Amount > 0
            ? WalletTransactionType.Deposit
            : WalletTransactionType.Withdraw;

        _ctx.WalletTransactions.Add(new WalletTransaction
        {
            WalletId = wallet.Id,
            Type = txType,
            Amount = request.Amount,
            BalanceAfter = wallet.Balance,
            Note = $"[Admin] {request.Note}",
            CreatedAt = DateTime.UtcNow
        });

        await _ctx.SaveChangesAsync();

        _logger.LogInformation(
            "Admin {AdminId} adjusted wallet of User {UserId}: {Amount:+#;-#;0} VND. Note: {Note}",
            adminId, userId, request.Amount, request.Note);
    }
}

using GameStore.API.DTOs.Admin;
using GameStore.API.Exceptions;
using GameStore.API.Models.Constants;
using GameStore.API.Models.Entities;
using GameStore.API.Models.Enums;
using GameStore.API.Repositories.Interfaces;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Services;

public class CollaboratorService : ICollaboratorService
{
    private readonly IUserRepository _userRepo;
    private readonly ILogger<CollaboratorService> _logger;

    public CollaboratorService(IUserRepository userRepo, ILogger<CollaboratorService> logger)
    {
        _userRepo = userRepo;
        _logger = logger;
    }

    /// <summary>
    /// RULE 05 — Chỉ Admin mới được cấp quyền Collaborator.
    /// Phải tạo CollaboratorContract + InsuranceDeposit (RULE 08, RULE 15#15).
    /// </summary>
    public async Task GrantCollaboratorRoleAsync(Guid adminId, Guid userId, GrantCollaboratorRequest request)
    {
        var user = await _userRepo.GetByIdWithDetailsAsync(userId)
            ?? throw new NotFoundException("Người dùng không tồn tại.");

        if (user.Role == UserRole.Admin)
            throw new BusinessException("Không thể thay đổi quyền của Admin.");

        if (user.Role == UserRole.Collaborator)
            throw new BusinessException("Người dùng đã là Collaborator.");

        // Nâng role
        user.Role = UserRole.Collaborator;
        user.UpdatedAt = DateTime.UtcNow;

        // Tạo hợp đồng — RULE 08
        var contract = new CollaboratorContract
        {
            CollaboratorId = userId,
            AdminFeeRate = request.AdminFeeRate,
            InsuranceAmount = request.InsuranceAmount,
            ContractStatus = CollaboratorContractStatus.Active,
            StartDate = DateTime.UtcNow,
            AdminNote = request.AdminNote,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Tạo phí bảo hiểm với status Held — RULE 08
        var insuranceDeposit = new InsuranceDeposit
        {
            CollaboratorId = userId,
            Amount = request.InsuranceAmount,
            Status = InsuranceDepositStatus.Held,
            AdminNote = request.AdminNote,
            CreatedAt = DateTime.UtcNow
        };

        user.CollaboratorContracts.Add(contract);
        user.InsuranceDeposits.Add(insuranceDeposit);

        // Tạo CollaboratorStats nếu chưa có
        if (user.CollaboratorStats == null)
        {
            user.CollaboratorStats = new CollaboratorStats
            {
                // Let EF handle UserId mapping to mark entity as Added properly
                TotalSold = 0,
                AvgRating = 0,
                DisputeRate = 0,
                ReputationScore = 0,
                BadgeLevel = "New",
                UpdatedAt = DateTime.UtcNow
            };
        }

        await _userRepo.SaveChangesAsync();

        _logger.LogInformation(
            "Admin {AdminId} granted Collaborator role to User {UserId}. FeeRate: {FeeRate}, Insurance: {Insurance}",
            adminId, userId, request.AdminFeeRate, request.InsuranceAmount);
    }

    public async Task RevokeCollaboratorRoleAsync(Guid adminId, Guid userId)
    {
        var user = await _userRepo.GetByIdAsync(userId)
            ?? throw new NotFoundException("Người dùng không tồn tại.");

        if (user.Role != UserRole.Collaborator)
            throw new BusinessException("Người dùng không phải Collaborator.");

        user.Role = UserRole.Customer;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepo.SaveChangesAsync();

        _logger.LogInformation("Admin {AdminId} revoked Collaborator role from User {UserId}", adminId, userId);
    }

    public async Task SuspendUserAsync(Guid userId)
    {
        var user = await _userRepo.GetByIdAsync(userId)
            ?? throw new NotFoundException("Người dùng không tồn tại.");

        if (user.Role == UserRole.Admin)
            throw new BusinessException("Không thể đình chỉ Admin.");

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepo.SaveChangesAsync();

        _logger.LogWarning("User {UserId} has been suspended", userId);
    }

    public async Task ActivateUserAsync(Guid userId)
    {
        var user = await _userRepo.GetByIdAsync(userId)
            ?? throw new NotFoundException("Người dùng không tồn tại.");

        user.IsActive = true;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepo.SaveChangesAsync();

        _logger.LogInformation("User {UserId} has been activated", userId);
    }

    /// <summary>
    /// Unified role change: Customer ↔ Collaborator.
    /// When promoting to Collaborator, creates contract + stats.
    /// When demoting, revokes collaborator role.
    /// </summary>
    public async Task ChangeUserRoleAsync(Guid adminId, Guid userId, ChangeUserRoleRequest request)
    {
        if (!Enum.TryParse<UserRole>(request.Role, out var targetRole))
            throw new BusinessException($"Vai trò không hợp lệ: {request.Role}");

        if (targetRole == UserRole.Admin)
            throw new BusinessException("Không thể gán vai trò Admin.");

        if (targetRole == UserRole.Guest)
            throw new BusinessException("Không thể gán vai trò Guest.");

        var user = await _userRepo.GetByIdWithDetailsAsync(userId)
            ?? throw new NotFoundException("Người dùng không tồn tại.");

        if (user.Role == UserRole.Admin)
            throw new BusinessException("Không thể thay đổi vai trò của Admin.");

        if (user.Role == targetRole)
            throw new BusinessException($"Người dùng đã có vai trò {targetRole}.");

        if (targetRole == UserRole.Collaborator)
        {
            // Promote to Collaborator
            var feeRate = request.AdminFeeRate ?? 0.15m;
            var insuranceAmount = request.InsuranceAmount ?? 0m;

            user.Role = UserRole.Collaborator;
            user.UpdatedAt = DateTime.UtcNow;

            // Create contract
            var contract = new CollaboratorContract
            {
                CollaboratorId = userId,
                AdminFeeRate = feeRate,
                InsuranceAmount = insuranceAmount,
                ContractStatus = CollaboratorContractStatus.Active,
                StartDate = DateTime.UtcNow,
                AdminNote = request.AdminNote,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Create insurance deposit if amount > 0
            if (insuranceAmount > 0)
            {
                var deposit = new InsuranceDeposit
                {
                    CollaboratorId = userId,
                    Amount = insuranceAmount,
                    Status = InsuranceDepositStatus.Held,
                    AdminNote = request.AdminNote,
                    CreatedAt = DateTime.UtcNow
                };
                user.InsuranceDeposits.Add(deposit);
            }

            user.CollaboratorContracts.Add(contract);

            // Create stats if not exists
            if (user.CollaboratorStats == null)
            {
                user.CollaboratorStats = new CollaboratorStats
                {
                    TotalSold = 0,
                    AvgRating = 0,
                    DisputeRate = 0,
                    ReputationScore = 0,
                    BadgeLevel = "New",
                    UpdatedAt = DateTime.UtcNow
                };
            }

            _logger.LogInformation(
                "Admin {AdminId} promoted User {UserId} to Collaborator. FeeRate: {FeeRate}",
                adminId, userId, feeRate);
        }
        else
        {
            // Demote to Customer
            user.Role = UserRole.Customer;
            user.UpdatedAt = DateTime.UtcNow;

            _logger.LogInformation(
                "Admin {AdminId} demoted User {UserId} to Customer",
                adminId, userId);
        }

        await _userRepo.SaveChangesAsync();
    }
}

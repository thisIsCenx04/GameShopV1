using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GameStore.API.DTOs.Admin;
using GameStore.API.DTOs.Common;
using GameStore.API.Models.Constants;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Controllers.Admin;

/// <summary>
/// RULE 05 — Tất cả endpoint đều yêu cầu role Admin
/// </summary>
[ApiController]
[Route("api/v1/admin/users")]
[Authorize(Roles = "Admin")]
public class AdminUsersController : ControllerBase
{
    private readonly ICollaboratorService _collaboratorService;
    private readonly IUserService _userService;

    public AdminUsersController(
        ICollaboratorService collaboratorService,
        IUserService userService)
    {
        _collaboratorService = collaboratorService;
        _userService = userService;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int page = AppConstants.DEFAULT_PAGE,
        [FromQuery] int pageSize = AppConstants.DEFAULT_PAGE_SIZE)
    {
        if (pageSize > AppConstants.MAX_PAGE_SIZE) pageSize = AppConstants.MAX_PAGE_SIZE;
        var result = await _userService.GetUsersAsync(page, pageSize);
        return Ok(ApiResponse.Success(result.Items, result.ToPaginationMeta()));
    }

    /// <summary>
    /// Get user detail including wallet, commission, stats
    /// </summary>
    [HttpGet("{userId:guid}")]
    public async Task<IActionResult> GetUserDetail(Guid userId)
    {
        var result = await _userService.GetUserDetailForAdminAsync(userId);
        return Ok(ApiResponse.Success(result));
    }

    /// <summary>
    /// Admin update user profile + commission rate
    /// </summary>
    [HttpPut("{userId:guid}")]
    public async Task<IActionResult> UpdateUser(Guid userId, [FromBody] AdminUpdateUserRequest request)
    {
        var result = await _userService.AdminUpdateUserAsync(userId, request);
        return Ok(ApiResponse.Success(result, "Cập nhật thành công."));
    }

    /// <summary>
    /// Unified role change: Customer ↔ Collaborator
    /// </summary>
    [HttpPost("{userId:guid}/change-role")]
    public async Task<IActionResult> ChangeRole(Guid userId, [FromBody] ChangeUserRoleRequest request)
    {
        await _collaboratorService.ChangeUserRoleAsync(GetUserId(), userId, request);
        return Ok(ApiResponse.Success<object?>(null, $"Đã chuyển vai trò thành {request.Role}."));
    }

    /// <summary>
    /// Admin wallet adjustment (credit/debit)
    /// </summary>
    [HttpPost("{userId:guid}/adjust-wallet")]
    public async Task<IActionResult> AdjustWallet(Guid userId, [FromBody] AdminAdjustWalletRequest request)
    {
        await _userService.AdjustWalletAsync(GetUserId(), userId, request);
        var verb = request.Amount > 0 ? "cộng" : "trừ";
        return Ok(ApiResponse.Success<object?>(null, $"Đã {verb} {Math.Abs(request.Amount):N0} VND vào ví."));
    }

    /// <summary>
    /// RULE 05 — Admin cấp quyền Collaborator + tạo hợp đồng + phí bảo hiểm
    /// </summary>
    [HttpPost("{userId:guid}/grant-collaborator")]
    public async Task<IActionResult> GrantCollaborator(
        Guid userId,
        [FromBody] GrantCollaboratorRequest request)
    {
        await _collaboratorService.GrantCollaboratorRoleAsync(GetUserId(), userId, request);
        return Ok(ApiResponse.Success<object?>(null, "Đã cấp quyền Collaborator thành công."));
    }

    [HttpPost("{userId:guid}/revoke-collaborator")]
    public async Task<IActionResult> RevokeCollaborator(Guid userId)
    {
        await _collaboratorService.RevokeCollaboratorRoleAsync(GetUserId(), userId);
        return Ok(ApiResponse.Success<object?>(null, "Đã thu hồi quyền Collaborator."));
    }

    [HttpPost("{userId:guid}/suspend")]
    public async Task<IActionResult> SuspendUser(Guid userId)
    {
        await _collaboratorService.SuspendUserAsync(userId);
        return Ok(ApiResponse.Success<object?>(null, "Đã đình chỉ tài khoản."));
    }

    [HttpPost("{userId:guid}/activate")]
    public async Task<IActionResult> ActivateUser(Guid userId)
    {
        await _collaboratorService.ActivateUserAsync(userId);
        return Ok(ApiResponse.Success<object?>(null, "Đã kích hoạt tài khoản."));
    }

    private Guid GetUserId()
        => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException());
}

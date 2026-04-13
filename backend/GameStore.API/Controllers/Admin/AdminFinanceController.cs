using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GameStore.API.DTOs.Common;
using GameStore.API.DTOs.Disputes;
using GameStore.API.DTOs.Wallet;
using GameStore.API.Models.Constants;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Controllers.Admin;

/// <summary>
/// Admin finance & dispute management
/// </summary>
[ApiController]
[Route("api/v1/admin")]
[Authorize(Roles = "Admin")]
public class AdminFinanceController : ControllerBase
{
    private readonly IWalletService _walletService;
    private readonly IDisputeService _disputeService;
    private readonly IOrderService _orderService;

    public AdminFinanceController(
        IWalletService walletService,
        IDisputeService disputeService,
        IOrderService orderService)
    {
        _walletService = walletService;
        _disputeService = disputeService;
        _orderService = orderService;
    }

    // ===== Orders =====
    [HttpGet("orders")]
    public async Task<IActionResult> GetAllOrders(
        [FromQuery] int page = AppConstants.DEFAULT_PAGE,
        [FromQuery] int pageSize = AppConstants.DEFAULT_PAGE_SIZE)
    {
        var result = await _orderService.GetAllOrdersAsync(page, pageSize);
        return Ok(ApiResponse.Success(result.Items, result.ToPaginationMeta()));
    }

    // ===== Withdrawals =====
    [HttpGet("withdraws/pending")]
    public async Task<IActionResult> GetPendingWithdraws(
        [FromQuery] int page = AppConstants.DEFAULT_PAGE,
        [FromQuery] int pageSize = AppConstants.DEFAULT_PAGE_SIZE)
    {
        var result = await _walletService.GetPendingWithdrawsAsync(page, pageSize);
        return Ok(ApiResponse.Success(result.Items, result.ToPaginationMeta()));
    }

    [HttpPost("withdraws/{id:guid}/approve")]
    public async Task<IActionResult> ApproveWithdraw(Guid id)
    {
        await _walletService.ApproveWithdrawAsync(GetUserId(), id);
        return Ok(ApiResponse.Success<object?>(null, "Đã duyệt yêu cầu rút tiền."));
    }

    [HttpPost("withdraws/{id:guid}/reject")]
    public async Task<IActionResult> RejectWithdraw(Guid id, [FromBody] AdminRejectRequest? request)
    {
        await _walletService.RejectWithdrawAsync(GetUserId(), id, request?.Reason);
        return Ok(ApiResponse.Success<object?>(null, "Đã từ chối yêu cầu rút tiền."));
    }

    // ===== Disputes =====
    [HttpGet("disputes")]
    public async Task<IActionResult> GetOpenDisputes(
        [FromQuery] int page = AppConstants.DEFAULT_PAGE,
        [FromQuery] int pageSize = AppConstants.DEFAULT_PAGE_SIZE)
    {
        var result = await _disputeService.GetOpenDisputesAsync(page, pageSize);
        return Ok(ApiResponse.Success(result.Items, result.ToPaginationMeta()));
    }

    [HttpPost("disputes/{id:guid}/resolve")]
    public async Task<IActionResult> ResolveDispute(Guid id, [FromBody] ResolveDisputeRequest request)
    {
        await _disputeService.ResolveDisputeAsync(GetUserId(), id, request);
        return Ok(ApiResponse.Success<object?>(null, "Đã xử lý khiếu nại."));
    }

    private Guid GetUserId()
        => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException());
}

public class AdminRejectRequest
{
    public string? Reason { get; set; }
}

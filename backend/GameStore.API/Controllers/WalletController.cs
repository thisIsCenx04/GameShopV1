using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GameStore.API.DTOs.Common;
using GameStore.API.DTOs.Wallet;
using GameStore.API.Models.Constants;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Controllers;

[ApiController]
[Route("api/v1/wallet")]
[Authorize]
public class WalletController : ControllerBase
{
    private readonly IWalletService _walletService;

    public WalletController(IWalletService walletService)
        => _walletService = walletService;

    [HttpGet]
    public async Task<IActionResult> GetWallet()
    {
        var result = await _walletService.GetWalletAsync(GetUserId());
        return Ok(ApiResponse.Success(result));
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions(
        [FromQuery] int page = AppConstants.DEFAULT_PAGE,
        [FromQuery] int pageSize = AppConstants.DEFAULT_PAGE_SIZE)
    {
        var result = await _walletService.GetTransactionsAsync(GetUserId(), page, pageSize);
        return Ok(ApiResponse.Success(result.Items, result.ToPaginationMeta()));
    }

    /// <summary>Nạp tiền (MVP: trực tiếp)</summary>
    [HttpPost("deposit")]
    public async Task<IActionResult> Deposit([FromBody] DepositRequest request)
    {
        var result = await _walletService.DepositAsync(GetUserId(), request);
        return Ok(ApiResponse.Success(result, "Nạp tiền thành công."));
    }

    /// <summary>Yêu cầu rút tiền</summary>
    [HttpPost("withdraw")]
    public async Task<IActionResult> RequestWithdraw([FromBody] WithdrawRequestDto request)
    {
        var result = await _walletService.RequestWithdrawAsync(GetUserId(), request);
        return Created("", ApiResponse.Success(result, "Yêu cầu rút tiền đã được gửi."));
    }

    [HttpGet("withdraws")]
    public async Task<IActionResult> GetMyWithdraws(
        [FromQuery] int page = AppConstants.DEFAULT_PAGE,
        [FromQuery] int pageSize = AppConstants.DEFAULT_PAGE_SIZE)
    {
        var result = await _walletService.GetMyWithdrawsAsync(GetUserId(), page, pageSize);
        return Ok(ApiResponse.Success(result.Items, result.ToPaginationMeta()));
    }

    private Guid GetUserId()
        => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException());
}

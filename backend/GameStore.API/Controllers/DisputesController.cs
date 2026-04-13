using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GameStore.API.DTOs.Common;
using GameStore.API.DTOs.Disputes;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Controllers;

[ApiController]
[Route("api/v1/disputes")]
[Authorize]
public class DisputesController : ControllerBase
{
    private readonly IDisputeService _disputeService;

    public DisputesController(IDisputeService disputeService)
        => _disputeService = disputeService;

    [HttpPost("orders/{orderId:guid}")]
    public async Task<IActionResult> CreateDispute(Guid orderId, [FromBody] CreateDisputeRequest request)
    {
        var result = await _disputeService.CreateDisputeAsync(GetUserId(), orderId, request);
        return Created("", ApiResponse.Success(result, "Khiếu nại đã được gửi."));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetDispute(Guid id)
    {
        var result = await _disputeService.GetDisputeAsync(GetUserId(), id);
        return Ok(ApiResponse.Success(result));
    }

    private Guid GetUserId()
        => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException());
}

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GameStore.API.DTOs.Common;
using GameStore.API.DTOs.Orders;
using GameStore.API.Models.Constants;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Controllers;

[ApiController]
[Route("api/v1/orders")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
        => _orderService = orderService;

    /// <summary>Mua sản phẩm — trừ tiền ví, tạo đơn</summary>
    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var result = await _orderService.CreateOrderAsync(GetUserId(), request);
        return Created("", ApiResponse.Success(result, "Đặt hàng thành công."));
    }

    /// <summary>Đơn hàng tôi đã mua</summary>
    [HttpGet("my-purchases")]
    public async Task<IActionResult> GetMyOrders(
        [FromQuery] int page = AppConstants.DEFAULT_PAGE,
        [FromQuery] int pageSize = AppConstants.DEFAULT_PAGE_SIZE)
    {
        var result = await _orderService.GetMyOrdersAsync(GetUserId(), page, pageSize);
        return Ok(ApiResponse.Success(result.Items, result.ToPaginationMeta()));
    }

    /// <summary>Đơn hàng sản phẩm tôi bán</summary>
    [HttpGet("my-sales")]
    [Authorize(Roles = "Collaborator,Admin")]
    public async Task<IActionResult> GetCollaboratorOrders(
        [FromQuery] int page = AppConstants.DEFAULT_PAGE,
        [FromQuery] int pageSize = AppConstants.DEFAULT_PAGE_SIZE)
    {
        var result = await _orderService.GetCollaboratorOrdersAsync(GetUserId(), page, pageSize);
        return Ok(ApiResponse.Success(result.Items, result.ToPaginationMeta()));
    }

    /// <summary>Chi tiết đơn hàng</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetOrderDetail(Guid id)
    {
        var result = await _orderService.GetOrderDetailAsync(GetUserId(), id);
        return Ok(ApiResponse.Success(result));
    }

    /// <summary>Collaborator giao tài khoản</summary>
    [HttpPost("{id:guid}/deliver")]
    [Authorize(Roles = "Collaborator,Admin")]
    public async Task<IActionResult> DeliverAccount(Guid id, [FromBody] DeliverAccountRequest request)
    {
        await _orderService.DeliverAccountAsync(GetUserId(), id, request);
        return Ok(ApiResponse.Success<object?>(null, "Đã giao tài khoản."));
    }

    /// <summary>Buyer xác nhận nhận hàng</summary>
    [HttpPost("{id:guid}/confirm")]
    public async Task<IActionResult> ConfirmReceived(Guid id)
    {
        await _orderService.ConfirmReceivedAsync(GetUserId(), id);
        return Ok(ApiResponse.Success<object?>(null, "Đã xác nhận nhận hàng."));
    }

    private Guid GetUserId()
        => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException());
}

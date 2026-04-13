using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GameStore.API.DTOs.Common;
using GameStore.API.Models.Constants;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Controllers;

[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
        => _notificationService = notificationService;

    [HttpGet]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] int page = AppConstants.DEFAULT_PAGE,
        [FromQuery] int pageSize = AppConstants.DEFAULT_PAGE_SIZE)
    {
        var result = await _notificationService.GetNotificationsAsync(GetUserId(), page, pageSize);
        return Ok(ApiResponse.Success(result.Items, result.ToPaginationMeta()));
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var count = await _notificationService.GetUnreadCountAsync(GetUserId());
        return Ok(ApiResponse.Success(new { count }));
    }

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        await _notificationService.MarkAsReadAsync(GetUserId(), id);
        return Ok(ApiResponse.Success<object?>(null, "Đã đánh dấu đã đọc."));
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        await _notificationService.MarkAllAsReadAsync(GetUserId());
        return Ok(ApiResponse.Success<object?>(null, "Đã đánh dấu tất cả đã đọc."));
    }

    private Guid GetUserId()
        => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException());
}

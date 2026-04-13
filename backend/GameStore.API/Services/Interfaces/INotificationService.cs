using GameStore.API.DTOs.Common;
using GameStore.API.DTOs.Notifications;

namespace GameStore.API.Services.Interfaces;

public interface INotificationService
{
    Task<PagedResult<NotificationResponse>> GetNotificationsAsync(Guid userId, int page, int pageSize);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task MarkAsReadAsync(Guid userId, Guid notificationId);
    Task MarkAllAsReadAsync(Guid userId);
    Task SendNotificationAsync(Guid userId, string type, string title, string body, string? metaJson = null);
}

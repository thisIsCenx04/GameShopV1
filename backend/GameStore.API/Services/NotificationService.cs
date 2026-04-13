using Microsoft.EntityFrameworkCore;
using GameStore.API.DTOs.Common;
using GameStore.API.DTOs.Notifications;
using GameStore.API.Models.Entities;
using GameStore.API.Repositories.Data;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _ctx;

    public NotificationService(AppDbContext ctx) => _ctx = ctx;

    public async Task<PagedResult<NotificationResponse>> GetNotificationsAsync(
        Guid userId, int page, int pageSize)
    {
        var query = _ctx.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt);

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        var mapped = items.Select(n => new NotificationResponse
        {
            Id = n.Id,
            Type = n.Type,
            Title = n.Title,
            Body = n.Body,
            IsRead = n.IsRead,
            MetaJson = n.MetaJson,
            CreatedAt = n.CreatedAt
        }).ToList();

        return new PagedResult<NotificationResponse>(mapped, total, page, pageSize);
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
        => await _ctx.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);

    public async Task MarkAsReadAsync(Guid userId, Guid notificationId)
    {
        await _ctx.Notifications
            .Where(n => n.Id == notificationId && n.UserId == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        await _ctx.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
    }

    public async Task SendNotificationAsync(
        Guid userId, string type, string title, string body, string? metaJson = null)
    {
        _ctx.Notifications.Add(new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Body = body,
            MetaJson = metaJson,
            CreatedAt = DateTime.UtcNow
        });

        await _ctx.SaveChangesAsync();
    }
}

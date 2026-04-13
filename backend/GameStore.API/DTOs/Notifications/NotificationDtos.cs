namespace GameStore.API.DTOs.Notifications;

public class NotificationResponse
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public string? MetaJson { get; set; }
    public DateTime CreatedAt { get; set; }
}

namespace GameStore.API.Models.Entities;

/// <summary>
/// Mẫu thông báo theo Type - nhóm Social
/// </summary>
public class NotificationTemplate
{
    public string TemplateKey { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string BodyTemplate { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

using GameStore.API.Models.Enums;

namespace GameStore.API.Models.Entities;

/// <summary>
/// Audit log trạng thái đơn hàng - nhóm Transaction
/// </summary>
public class OrderStatusLog
{
    public int Id { get; set; }
    public Guid OrderId { get; set; }
    public OrderStatus OldStatus { get; set; }
    public OrderStatus NewStatus { get; set; }
    public Guid? ChangedBy { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Order Order { get; set; } = null!;
}

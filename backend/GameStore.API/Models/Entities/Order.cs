using GameStore.API.Models.Enums;

namespace GameStore.API.Models.Entities;

/// <summary>
/// Đơn hàng - nhóm Transaction
/// </summary>
public class Order
{
    public Guid Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public Guid BuyerId { get; set; }
    public Guid ListingId { get; set; }
    public decimal Amount { get; set; }
    public decimal CollaboratorEarning { get; set; }
    public decimal AdminFee { get; set; }
    public string PaymentMethod { get; set; } = string.Empty; // wallet, momo, vnpay, banking
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public DateTime? ExpiredAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User Buyer { get; set; } = null!;
    public ProductListing Listing { get; set; } = null!;
    public AccountDelivery? AccountDelivery { get; set; }
    public ICollection<OrderStatusLog> StatusLogs { get; set; } = new List<OrderStatusLog>();
    public ICollection<Dispute> Disputes { get; set; } = new List<Dispute>();
    public Review? Review { get; set; }
}

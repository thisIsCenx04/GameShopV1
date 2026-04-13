namespace GameStore.API.DTOs.Orders;

// ==================== Request DTOs ====================

public class CreateOrderRequest
{
    public Guid ListingId { get; set; }
    public string PaymentMethod { get; set; } = "wallet"; // wallet, momo, vnpay
}

public class DeliverAccountRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

// ==================== Response DTOs ====================

public class OrderResponse
{
    public Guid Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public Guid BuyerId { get; set; }
    public string BuyerName { get; set; } = string.Empty;
    public Guid ListingId { get; set; }
    public string ProductTitle { get; set; } = string.Empty;
    public string GameName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal CollaboratorEarning { get; set; }
    public decimal AdminFee { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class OrderDetailResponse : OrderResponse
{
    public string? CollaboratorName { get; set; }
    public AccountDeliveryDto? AccountDelivery { get; set; }
    public List<OrderStatusLogDto> StatusLogs { get; set; } = new();
}

public class AccountDeliveryDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class OrderStatusLogDto
{
    public string FromStatus { get; set; } = string.Empty;
    public string ToStatus { get; set; } = string.Empty;
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}

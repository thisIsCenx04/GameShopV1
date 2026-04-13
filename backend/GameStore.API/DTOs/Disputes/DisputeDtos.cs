namespace GameStore.API.DTOs.Disputes;

public class CreateDisputeRequest
{
    public string Reason { get; set; } = string.Empty;
    public List<string>? AttachmentUrls { get; set; }
}

public class ResolveDisputeRequest
{
    public string Resolution { get; set; } = string.Empty;
    public bool RefundBuyer { get; set; }
    public string? AdminNote { get; set; }
}

public class DisputeResponse
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public Guid ReporterId { get; set; }
    public string ReporterName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Resolution { get; set; }
    public string? AdminNote { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<string> AttachmentUrls { get; set; } = new();
}

namespace GameStore.API.Models.Entities;

/// <summary>
/// File bằng chứng khiếu nại - nhóm Transaction
/// </summary>
public class DisputeAttachment
{
    public Guid Id { get; set; }
    public Guid DisputeId { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public Guid UploadedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Dispute Dispute { get; set; } = null!;
}

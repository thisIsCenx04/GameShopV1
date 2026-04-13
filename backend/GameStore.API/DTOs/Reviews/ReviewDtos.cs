namespace GameStore.API.DTOs.Reviews;

public class CreateReviewRequest
{
    public int Rating { get; set; }
    public string? Comment { get; set; }
}

public class ReviewResponse
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string ReviewerName { get; set; } = string.Empty;
    public string? ReviewerAvatar { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}

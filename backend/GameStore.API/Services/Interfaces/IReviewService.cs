using GameStore.API.DTOs.Common;
using GameStore.API.DTOs.Reviews;

namespace GameStore.API.Services.Interfaces;

public interface IReviewService
{
    Task<ReviewResponse> CreateReviewAsync(Guid userId, Guid orderId, CreateReviewRequest request);
    Task<PagedResult<ReviewResponse>> GetCollaboratorReviewsAsync(Guid collaboratorId, int page, int pageSize);
}

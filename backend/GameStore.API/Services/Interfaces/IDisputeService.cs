using GameStore.API.DTOs.Common;
using GameStore.API.DTOs.Disputes;

namespace GameStore.API.Services.Interfaces;

public interface IDisputeService
{
    Task<DisputeResponse> CreateDisputeAsync(Guid reporterId, Guid orderId, CreateDisputeRequest request);
    Task<DisputeResponse> GetDisputeAsync(Guid userId, Guid disputeId);
    Task<PagedResult<DisputeResponse>> GetOpenDisputesAsync(int page, int pageSize);
    Task ResolveDisputeAsync(Guid adminId, Guid disputeId, ResolveDisputeRequest request);
}

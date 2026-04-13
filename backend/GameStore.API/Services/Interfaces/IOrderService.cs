using GameStore.API.DTOs.Common;
using GameStore.API.DTOs.Orders;

namespace GameStore.API.Services.Interfaces;

public interface IOrderService
{
    Task<OrderDetailResponse> CreateOrderAsync(Guid buyerId, CreateOrderRequest request);
    Task<OrderDetailResponse> GetOrderDetailAsync(Guid userId, Guid orderId);
    Task<PagedResult<OrderResponse>> GetMyOrdersAsync(Guid userId, int page, int pageSize);
    Task<PagedResult<OrderResponse>> GetCollaboratorOrdersAsync(Guid collaboratorId, int page, int pageSize);
    Task DeliverAccountAsync(Guid collaboratorId, Guid orderId, DeliverAccountRequest request);
    Task ConfirmReceivedAsync(Guid buyerId, Guid orderId);
    Task<PagedResult<OrderResponse>> GetAllOrdersAsync(int page, int pageSize);
}

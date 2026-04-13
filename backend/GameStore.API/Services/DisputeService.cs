using Microsoft.EntityFrameworkCore;
using GameStore.API.DTOs.Common;
using GameStore.API.DTOs.Disputes;
using GameStore.API.Exceptions;
using GameStore.API.Models.Constants;
using GameStore.API.Models.Entities;
using GameStore.API.Models.Enums;
using GameStore.API.Repositories.Data;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Services;

public class DisputeService : IDisputeService
{
    private readonly AppDbContext _ctx;
    private readonly ILogger<DisputeService> _logger;

    public DisputeService(AppDbContext ctx, ILogger<DisputeService> logger)
    {
        _ctx = ctx;
        _logger = logger;
    }

    public async Task<DisputeResponse> CreateDisputeAsync(
        Guid reporterId, Guid orderId, CreateDisputeRequest request)
    {
        var order = await _ctx.Orders.FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new NotFoundException(ErrorMessages.ORDER_NOT_FOUND);

        if (order.BuyerId != reporterId)
            throw new ForbiddenException("Chỉ người mua mới có thể khiếu nại.");

        if (order.Status != OrderStatus.Delivered && order.Status != OrderStatus.Completed)
            throw new BusinessException("Chỉ có thể khiếu nại đơn hàng đã giao hoặc hoàn thành.");

        var dispute = new Dispute
        {
            OrderId = orderId,
            ReporterId = reporterId,
            Reason = request.Reason,
            Status = "Open",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (request.AttachmentUrls != null)
        {
            foreach (var url in request.AttachmentUrls)
            {
                dispute.Attachments.Add(new DisputeAttachment
                {
                    FileUrl = url,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        order.Status = OrderStatus.Disputed;
        order.UpdatedAt = DateTime.UtcNow;

        _ctx.Disputes.Add(dispute);
        await _ctx.SaveChangesAsync();

        _logger.LogWarning("Dispute created for order {OrderId} by {ReporterId}", orderId, reporterId);

        return MapDispute(dispute, order.OrderCode);
    }

    public async Task<DisputeResponse> GetDisputeAsync(Guid userId, Guid disputeId)
    {
        var dispute = await _ctx.Disputes
            .Include(d => d.Order)
            .Include(d => d.Reporter).ThenInclude(u => u.Profile)
            .Include(d => d.Attachments)
            .FirstOrDefaultAsync(d => d.Id == disputeId)
            ?? throw new NotFoundException("Khiếu nại không tồn tại.");

        return MapDispute(dispute, dispute.Order.OrderCode);
    }

    public async Task<PagedResult<DisputeResponse>> GetOpenDisputesAsync(int page, int pageSize)
    {
        var query = _ctx.Disputes
            .Include(d => d.Order)
            .Include(d => d.Reporter).ThenInclude(u => u.Profile)
            .Include(d => d.Attachments)
            .Where(d => d.Status == "Open" || d.Status == "UnderReview")
            .OrderBy(d => d.CreatedAt);

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).AsSplitQuery().ToListAsync();

        return new PagedResult<DisputeResponse>(
            items.Select(d => MapDispute(d, d.Order.OrderCode)).ToList(), total, page, pageSize);
    }

    public async Task ResolveDisputeAsync(Guid adminId, Guid disputeId, ResolveDisputeRequest request)
    {
        var dispute = await _ctx.Disputes
            .Include(d => d.Order).ThenInclude(o => o.Listing)
            .FirstOrDefaultAsync(d => d.Id == disputeId)
            ?? throw new NotFoundException("Khiếu nại không tồn tại.");

        if (dispute.Status == "Resolved" || dispute.Status == "Rejected")
            throw new BusinessException("Khiếu nại đã được xử lý.");

        dispute.Status = "Resolved";
        dispute.Resolution = request.Resolution;
        dispute.AdminNote = request.AdminNote;
        dispute.UpdatedAt = DateTime.UtcNow;

        if (request.RefundBuyer)
        {
            var order = dispute.Order;
            var buyerWallet = await _ctx.Wallets.FirstOrDefaultAsync(w => w.UserId == order.BuyerId);
            if (buyerWallet != null)
            {
                buyerWallet.Balance += order.Amount;
                buyerWallet.UpdatedAt = DateTime.UtcNow;

                _ctx.WalletTransactions.Add(new WalletTransaction
                {
                    WalletId = buyerWallet.Id,
                    Type = WalletTransactionType.Refund,
                    Amount = order.Amount,
                    BalanceAfter = buyerWallet.Balance,
                    RefId = order.OrderCode,
                    Note = "Hoàn tiền do khiếu nại",
                    CreatedAt = DateTime.UtcNow
                });

                order.Status = OrderStatus.Refunded;
                order.UpdatedAt = DateTime.UtcNow;
            }
        }
        else
        {
            dispute.Order.Status = OrderStatus.Completed;
            dispute.Order.UpdatedAt = DateTime.UtcNow;
        }

        await _ctx.SaveChangesAsync();

        _logger.LogInformation(
            "Dispute resolved: {DisputeId} by Admin {AdminId}. Refund: {Refund}",
            disputeId, adminId, request.RefundBuyer);
    }

    private static DisputeResponse MapDispute(Dispute d, string orderCode) => new()
    {
        Id = d.Id,
        OrderId = d.OrderId,
        OrderCode = orderCode,
        ReporterId = d.ReporterId,
        ReporterName = d.Reporter?.Profile?.FullName ?? d.Reporter?.Email ?? "",
        Reason = d.Reason,
        Status = d.Status,
        Resolution = d.Resolution,
        AdminNote = d.AdminNote,
        CreatedAt = d.CreatedAt,
        UpdatedAt = d.UpdatedAt,
        AttachmentUrls = d.Attachments?.Select(a => a.FileUrl).ToList() ?? new()
    };
}

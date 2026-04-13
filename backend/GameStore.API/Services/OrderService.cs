using AutoMapper;
using Microsoft.EntityFrameworkCore;
using GameStore.API.DTOs.Common;
using GameStore.API.DTOs.Orders;
using GameStore.API.Exceptions;
using GameStore.API.Models.Constants;
using GameStore.API.Models.Entities;
using GameStore.API.Models.Enums;
using GameStore.API.Repositories.Data;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Services;

public class OrderService : IOrderService
{
    private readonly AppDbContext _ctx;
    private readonly IMapper _mapper;
    private readonly ILogger<OrderService> _logger;

    public OrderService(AppDbContext ctx, IMapper mapper, ILogger<OrderService> logger)
    {
        _ctx = ctx;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Luồng mua hàng chính: Kiểm tra → Trừ tiền → Tạo order → Freeze tiền seller → Log
    /// </summary>
    public async Task<OrderDetailResponse> CreateOrderAsync(Guid buyerId, CreateOrderRequest request)
    {
        // 1. Lấy sản phẩm + kiểm tra
        var listing = await _ctx.ProductListings
            .Include(p => p.Game)
            .Include(p => p.Collaborator)
            .FirstOrDefaultAsync(p => p.Id == request.ListingId)
            ?? throw new NotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);

        if (listing.Status != ProductStatus.Active)
            throw new BusinessException(ErrorMessages.PRODUCT_NOT_ACTIVE);

        if (listing.CollaboratorId == buyerId)
            throw new BusinessException(ErrorMessages.CANNOT_BUY_OWN_PRODUCT);

        // 2. Tính hoa hồng
        var commissionRule = await _ctx.CommissionRules
            .Where(c => c.EffectiveFrom <= DateTime.UtcNow)
            .OrderByDescending(c => c.Priority)
            .FirstOrDefaultAsync();
        var adminFeeRate = commissionRule?.AdminFeeRate ?? 0.15m;
        var adminFee = Math.Round(listing.Price * adminFeeRate, 0);
        var collaboratorEarning = listing.Price - adminFee;

        // 3. Kiểm tra ví buyer
        var buyerWallet = await _ctx.Wallets.FirstOrDefaultAsync(w => w.UserId == buyerId)
            ?? throw new NotFoundException(ErrorMessages.WALLET_NOT_FOUND);

        if (buyerWallet.Balance < listing.Price)
            throw new BusinessException(ErrorMessages.INSUFFICIENT_BALANCE);

        // 4. Transaction an toàn — sử dụng DB transaction
        using var transaction = await _ctx.Database.BeginTransactionAsync();
        try
        {
            // Trừ tiền buyer
            buyerWallet.Balance -= listing.Price;
            buyerWallet.UpdatedAt = DateTime.UtcNow;

            // Log wallet transaction buyer
            _ctx.WalletTransactions.Add(new WalletTransaction
            {
                WalletId = buyerWallet.Id,
                Type = WalletTransactionType.Purchase,
                Amount = -listing.Price,
                BalanceAfter = buyerWallet.Balance,
                Note = $"Mua sản phẩm: {listing.Title}",
                CreatedAt = DateTime.UtcNow
            });

            // Đánh dấu sản phẩm = Sold
            listing.Status = ProductStatus.Sold;
            listing.UpdatedAt = DateTime.UtcNow;

            // Tạo order
            var order = new Order
            {
                OrderCode = GenerateOrderCode(),
                BuyerId = buyerId,
                ListingId = listing.Id,
                Amount = listing.Price,
                CollaboratorEarning = collaboratorEarning,
                AdminFee = adminFee,
                PaymentMethod = request.PaymentMethod,
                Status = OrderStatus.Paid,
                ExpiredAt = DateTime.UtcNow.AddHours(24), // 24h để giao tài khoản
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Use navigation to let EF Core resolve FK
            order.StatusLogs.Add(new OrderStatusLog
            {
                OldStatus = OrderStatus.Pending,
                NewStatus = OrderStatus.Paid,
                Note = "Thanh toán thành công",
                CreatedAt = DateTime.UtcNow
            });

            _ctx.Orders.Add(order);

            // Ghi sổ cái hoa hồng — use SaveChanges first to get order.Id
            await _ctx.SaveChangesAsync();

            _ctx.CommissionLedgers.Add(new CommissionLedger
            {
                OrderId = order.Id,
                CollaboratorId = listing.CollaboratorId,
                AdminFee = adminFee,
                CollaboratorEarning = collaboratorEarning,
                Rate = adminFeeRate,
                CreatedAt = DateTime.UtcNow
            });

            await _ctx.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation(
                "Order created: {OrderCode}. Buyer: {BuyerId}, Amount: {Amount}, AdminFee: {AdminFee}",
                order.OrderCode, buyerId, listing.Price, adminFee);

            return await GetOrderDetailInternalAsync(order.Id);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// Collaborator giao tài khoản → status = Delivered
    /// </summary>
    public async Task DeliverAccountAsync(Guid collaboratorId, Guid orderId, DeliverAccountRequest request)
    {
        var order = await _ctx.Orders
            .Include(o => o.Listing)
            .FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new NotFoundException(ErrorMessages.ORDER_NOT_FOUND);

        if (order.Listing.CollaboratorId != collaboratorId)
            throw new ForbiddenException(ErrorMessages.FORBIDDEN);

        if (order.Status != OrderStatus.Paid)
            throw new BusinessException("Đơn hàng phải ở trạng thái Đã thanh toán.");

        // Lưu thông tin tài khoản (MVP: plaintext, production: AES-256-GCM)
        var delivery = new AccountDelivery
        {
            OrderId = orderId,
            EncryptedUsername = request.Username,
            EncryptedPassword = request.Password,
            EncryptedNotes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };
        _ctx.AccountDeliveries.Add(delivery);

        order.Status = OrderStatus.Delivered;
        order.UpdatedAt = DateTime.UtcNow;

        _ctx.OrderStatusLogs.Add(new OrderStatusLog
        {
            OrderId = orderId,
            OldStatus = OrderStatus.Paid,
            NewStatus = OrderStatus.Delivered,
            Note = "Đã giao tài khoản",
            CreatedAt = DateTime.UtcNow
        });

        await _ctx.SaveChangesAsync();

        _logger.LogInformation("Account delivered for order: {OrderId}", orderId);
    }

    /// <summary>
    /// Buyer xác nhận nhận hàng → Chuyển tiền cho Collaborator → Completed
    /// </summary>
    public async Task ConfirmReceivedAsync(Guid buyerId, Guid orderId)
    {
        var order = await _ctx.Orders
            .Include(o => o.Listing)
            .FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new NotFoundException(ErrorMessages.ORDER_NOT_FOUND);

        if (order.BuyerId != buyerId)
            throw new ForbiddenException(ErrorMessages.FORBIDDEN);

        if (order.Status != OrderStatus.Delivered)
            throw new BusinessException("Đơn hàng phải ở trạng thái Đã giao.");

        using var transaction = await _ctx.Database.BeginTransactionAsync();
        try
        {
            // Chuyển tiền cho collaborator
            var sellerWallet = await _ctx.Wallets
                .FirstOrDefaultAsync(w => w.UserId == order.Listing.CollaboratorId)
                ?? throw new NotFoundException(ErrorMessages.WALLET_NOT_FOUND);

            sellerWallet.Balance += order.CollaboratorEarning;
            sellerWallet.UpdatedAt = DateTime.UtcNow;

            _ctx.WalletTransactions.Add(new WalletTransaction
            {
                WalletId = sellerWallet.Id,
                Type = WalletTransactionType.Commission,
                Amount = order.CollaboratorEarning,
                BalanceAfter = sellerWallet.Balance,
                RefId = order.OrderCode,
                Note = $"Thu nhập từ đơn hàng {order.OrderCode}",
                CreatedAt = DateTime.UtcNow
            });

            order.Status = OrderStatus.Completed;
            order.CompletedAt = DateTime.UtcNow;
            order.UpdatedAt = DateTime.UtcNow;

            _ctx.OrderStatusLogs.Add(new OrderStatusLog
            {
                OrderId = orderId,
                OldStatus = OrderStatus.Delivered,
                NewStatus = OrderStatus.Completed,
                Note = "Buyer xác nhận đã nhận hàng",
                CreatedAt = DateTime.UtcNow
            });

            await _ctx.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation(
                "Order completed: {OrderCode}. Collaborator earned: {Earning}",
                order.OrderCode, order.CollaboratorEarning);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<OrderDetailResponse> GetOrderDetailAsync(Guid userId, Guid orderId)
    {
        var order = await _ctx.Orders
            .Include(o => o.Buyer).ThenInclude(u => u.Profile)
            .Include(o => o.Listing).ThenInclude(l => l.Game)
            .Include(o => o.Listing).ThenInclude(l => l.Collaborator).ThenInclude(u => u.Profile)
            .Include(o => o.AccountDelivery)
            .Include(o => o.StatusLogs)
            .AsSplitQuery()
            .FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new NotFoundException(ErrorMessages.ORDER_NOT_FOUND);

        // Chỉ buyer hoặc collaborator hoặc admin mới được xem
        if (order.BuyerId != userId && order.Listing.CollaboratorId != userId)
        {
            var user = await _ctx.Users.FindAsync(userId);
            if (user?.Role != UserRole.Admin)
                throw new ForbiddenException(ErrorMessages.FORBIDDEN);
        }

        return MapOrderDetail(order, userId);
    }

    public async Task<PagedResult<OrderResponse>> GetMyOrdersAsync(Guid userId, int page, int pageSize)
    {
        var query = _ctx.Orders
            .Include(o => o.Buyer).ThenInclude(u => u.Profile)
            .Include(o => o.Listing).ThenInclude(l => l.Game)
            .Where(o => o.BuyerId == userId)
            .OrderByDescending(o => o.CreatedAt);

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<OrderResponse>(items.Select(MapOrder).ToList(), total, page, pageSize);
    }

    public async Task<PagedResult<OrderResponse>> GetCollaboratorOrdersAsync(Guid collaboratorId, int page, int pageSize)
    {
        var query = _ctx.Orders
            .Include(o => o.Buyer).ThenInclude(u => u.Profile)
            .Include(o => o.Listing).ThenInclude(l => l.Game)
            .Where(o => o.Listing.CollaboratorId == collaboratorId)
            .OrderByDescending(o => o.CreatedAt);

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<OrderResponse>(items.Select(MapOrder).ToList(), total, page, pageSize);
    }

    public async Task<PagedResult<OrderResponse>> GetAllOrdersAsync(int page, int pageSize)
    {
        var query = _ctx.Orders
            .Include(o => o.Buyer).ThenInclude(u => u.Profile)
            .Include(o => o.Listing).ThenInclude(l => l.Game)
            .OrderByDescending(o => o.CreatedAt);

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<OrderResponse>(items.Select(MapOrder).ToList(), total, page, pageSize);
    }

    // ==================== Private ====================

    private async Task<OrderDetailResponse> GetOrderDetailInternalAsync(Guid orderId)
    {
        var order = await _ctx.Orders
            .Include(o => o.Buyer).ThenInclude(u => u.Profile)
            .Include(o => o.Listing).ThenInclude(l => l.Game)
            .Include(o => o.Listing).ThenInclude(l => l.Collaborator).ThenInclude(u => u.Profile)
            .Include(o => o.AccountDelivery)
            .Include(o => o.StatusLogs)
            .AsSplitQuery()
            .FirstAsync(o => o.Id == orderId);

        return MapOrderDetail(order, order.BuyerId);
    }

    private static OrderResponse MapOrder(Order o) => new()
    {
        Id = o.Id,
        OrderCode = o.OrderCode,
        BuyerId = o.BuyerId,
        BuyerName = o.Buyer?.Profile?.FullName ?? o.Buyer?.Email ?? "",
        ListingId = o.ListingId,
        ProductTitle = o.Listing?.Title ?? "",
        GameName = o.Listing?.Game?.Name ?? "",
        Amount = o.Amount,
        CollaboratorEarning = o.CollaboratorEarning,
        AdminFee = o.AdminFee,
        PaymentMethod = o.PaymentMethod,
        Status = o.Status.ToString(),
        CompletedAt = o.CompletedAt,
        CreatedAt = o.CreatedAt
    };

    private static OrderDetailResponse MapOrderDetail(Order o, Guid viewerId) => new()
    {
        Id = o.Id,
        OrderCode = o.OrderCode,
        BuyerId = o.BuyerId,
        BuyerName = o.Buyer?.Profile?.FullName ?? o.Buyer?.Email ?? "",
        ListingId = o.ListingId,
        ProductTitle = o.Listing?.Title ?? "",
        GameName = o.Listing?.Game?.Name ?? "",
        Amount = o.Amount,
        CollaboratorEarning = o.CollaboratorEarning,
        AdminFee = o.AdminFee,
        PaymentMethod = o.PaymentMethod,
        Status = o.Status.ToString(),
        CompletedAt = o.CompletedAt,
        CreatedAt = o.CreatedAt,
        CollaboratorName = o.Listing?.Collaborator?.Profile?.FullName ?? o.Listing?.Collaborator?.Email,
        AccountDelivery = o.AccountDelivery != null ? new AccountDeliveryDto
        {
            Username = o.AccountDelivery.EncryptedUsername,
            Password = o.AccountDelivery.EncryptedPassword,
            Notes = o.AccountDelivery.EncryptedNotes,
            CreatedAt = o.AccountDelivery.CreatedAt
        } : null,
        StatusLogs = o.StatusLogs?.OrderBy(s => s.CreatedAt).Select(s => new OrderStatusLogDto
        {
            FromStatus = s.OldStatus.ToString(),
            ToStatus = s.NewStatus.ToString(),
            Note = s.Note,
            CreatedAt = s.CreatedAt
        }).ToList() ?? new()
    };

    private static string GenerateOrderCode()
        => $"GS-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
}

using Microsoft.EntityFrameworkCore;
using GameStore.API.DTOs.Common;
using GameStore.API.DTOs.Reviews;
using GameStore.API.Exceptions;
using GameStore.API.Models.Constants;
using GameStore.API.Models.Entities;
using GameStore.API.Models.Enums;
using GameStore.API.Repositories.Data;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Services;

public class ReviewService : IReviewService
{
    private readonly AppDbContext _ctx;
    private readonly ILogger<ReviewService> _logger;

    public ReviewService(AppDbContext ctx, ILogger<ReviewService> logger)
    {
        _ctx = ctx;
        _logger = logger;
    }

    public async Task<ReviewResponse> CreateReviewAsync(Guid userId, Guid orderId, CreateReviewRequest request)
    {
        var order = await _ctx.Orders
            .Include(o => o.Listing)
            .FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new NotFoundException(ErrorMessages.ORDER_NOT_FOUND);

        if (order.BuyerId != userId)
            throw new ForbiddenException("Chỉ người mua mới có thể đánh giá.");

        if (order.Status != OrderStatus.Completed)
            throw new BusinessException("Chỉ có thể đánh giá đơn hàng đã hoàn thành.");

        if (await _ctx.Reviews.AnyAsync(r => r.OrderId == orderId))
            throw new BusinessException("Đơn hàng này đã được đánh giá.");

        if (request.Rating < 1 || request.Rating > 5)
            throw new BusinessException("Điểm đánh giá phải từ 1 đến 5.");

        var review = new Review
        {
            OrderId = orderId,
            ReviewerId = userId,
            Rating = request.Rating,
            Comment = request.Comment,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _ctx.Reviews.Add(review);

        // Cập nhật CollaboratorStats
        var stats = await _ctx.CollaboratorStats
            .FirstOrDefaultAsync(s => s.UserId == order.Listing.CollaboratorId);
        if (stats != null)
        {
            var allReviews = await _ctx.Reviews
                .Where(r => r.Order.Listing.CollaboratorId == order.Listing.CollaboratorId)
                .ToListAsync();

            allReviews.Add(review);
            stats.AvgRating = Math.Round((decimal)allReviews.Average(r => r.Rating), 2);
            stats.UpdatedAt = DateTime.UtcNow;
        }

        await _ctx.SaveChangesAsync();

        var user = await _ctx.Users.Include(u => u.Profile).FirstAsync(u => u.Id == userId);

        _logger.LogInformation("Review created for order {OrderId}: {Rating} stars", orderId, request.Rating);

        return new ReviewResponse
        {
            Id = review.Id,
            OrderId = orderId,
            ReviewerName = user.Profile?.FullName ?? user.Email,
            ReviewerAvatar = user.Profile?.AvatarUrl,
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt
        };
    }

    public async Task<PagedResult<ReviewResponse>> GetCollaboratorReviewsAsync(
        Guid collaboratorId, int page, int pageSize)
    {
        var query = _ctx.Reviews
            .Include(r => r.Reviewer).ThenInclude(u => u.Profile)
            .Where(r => r.Order.Listing.CollaboratorId == collaboratorId && r.IsVisible)
            .OrderByDescending(r => r.CreatedAt);

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        var mapped = items.Select(r => new ReviewResponse
        {
            Id = r.Id,
            OrderId = r.OrderId,
            ReviewerName = r.Reviewer?.Profile?.FullName ?? r.Reviewer?.Email ?? "",
            ReviewerAvatar = r.Reviewer?.Profile?.AvatarUrl,
            Rating = r.Rating,
            Comment = r.Comment,
            CreatedAt = r.CreatedAt
        }).ToList();

        return new PagedResult<ReviewResponse>(mapped, total, page, pageSize);
    }
}

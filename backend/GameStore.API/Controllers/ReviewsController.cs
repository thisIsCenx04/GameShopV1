using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GameStore.API.DTOs.Common;
using GameStore.API.DTOs.Reviews;
using GameStore.API.Models.Constants;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Controllers;

[ApiController]
[Route("api/v1/reviews")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviewService;

    public ReviewsController(IReviewService reviewService)
        => _reviewService = reviewService;

    [HttpPost("orders/{orderId:guid}")]
    [Authorize]
    public async Task<IActionResult> CreateReview(Guid orderId, [FromBody] CreateReviewRequest request)
    {
        var result = await _reviewService.CreateReviewAsync(GetUserId(), orderId, request);
        return Created("", ApiResponse.Success(result, "Đánh giá thành công."));
    }

    [HttpGet("collaborators/{collaboratorId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCollaboratorReviews(
        Guid collaboratorId,
        [FromQuery] int page = AppConstants.DEFAULT_PAGE,
        [FromQuery] int pageSize = AppConstants.DEFAULT_PAGE_SIZE)
    {
        var result = await _reviewService.GetCollaboratorReviewsAsync(collaboratorId, page, pageSize);
        return Ok(ApiResponse.Success(result.Items, result.ToPaginationMeta()));
    }

    private Guid GetUserId()
        => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException());
}

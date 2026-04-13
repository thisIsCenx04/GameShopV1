using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GameStore.API.DTOs.Common;
using GameStore.API.DTOs.Products;
using GameStore.API.Models.Constants;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Controllers.Admin;

/// <summary>
/// Admin product moderation — duyệt/từ chối/ẩn/featured
/// </summary>
[ApiController]
[Route("api/v1/admin/products")]
[Authorize(Roles = "Admin")]
public class AdminProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public AdminProductsController(IProductService productService)
        => _productService = productService;

    /// <summary>
    /// Danh sách tất cả sản phẩm (admin quản lý)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllProducts(
        [FromQuery] int page = AppConstants.DEFAULT_PAGE,
        [FromQuery] int pageSize = AppConstants.DEFAULT_PAGE_SIZE,
        [FromQuery] string? search = null)
    {
        if (pageSize > AppConstants.MAX_PAGE_SIZE) pageSize = AppConstants.MAX_PAGE_SIZE;
        var result = await _productService.GetAllProductsForAdminAsync(page, pageSize, search);
        return Ok(ApiResponse.Success(result.Items, result.ToPaginationMeta()));
    }

    /// <summary>
    /// Danh sách sản phẩm chờ duyệt (FIFO)
    /// </summary>
    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingProducts(
        [FromQuery] int page = AppConstants.DEFAULT_PAGE,
        [FromQuery] int pageSize = AppConstants.DEFAULT_PAGE_SIZE)
    {
        if (pageSize > AppConstants.MAX_PAGE_SIZE) pageSize = AppConstants.MAX_PAGE_SIZE;
        var result = await _productService.GetPendingProductsAsync(page, pageSize);
        return Ok(ApiResponse.Success(result.Items, result.ToPaginationMeta()));
    }

    /// <summary>
    /// Chi tiết sản phẩm (admin có thể xem tất cả trạng thái)
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetProductDetail(Guid id)
    {
        // Admin xem chi tiết không bị giới hạn status
        var result = await _productService.GetProductDetailAsync(id);
        return Ok(ApiResponse.Success(result));
    }

    /// <summary>
    /// Admin tạo sản phẩm mới — tự động Active, không cần duyệt
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request)
    {
        var result = await _productService.AdminCreateProductAsync(GetUserId(), request);
        return Created("", ApiResponse.Success(result, "Đã tạo và đăng sản phẩm thành công."));
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> ApproveProduct(Guid id)
    {
        await _productService.ApproveProductAsync(GetUserId(), id);
        return Ok(ApiResponse.Success<object?>(null, "Đã duyệt sản phẩm."));
    }

    [HttpPost("{id:guid}/reject")]
    public async Task<IActionResult> RejectProduct(Guid id, [FromBody] AdminApproveRequest? request)
    {
        await _productService.RejectProductAsync(GetUserId(), id, request?.AdminNote);
        return Ok(ApiResponse.Success<object?>(null, "Đã từ chối sản phẩm."));
    }

    [HttpPost("{id:guid}/toggle-featured")]
    public async Task<IActionResult> ToggleFeatured(Guid id)
    {
        await _productService.ToggleFeaturedAsync(id);
        return Ok(ApiResponse.Success<object?>(null, "Đã thay đổi trạng thái nổi bật."));
    }

    [HttpPost("{id:guid}/hide")]
    public async Task<IActionResult> HideProduct(Guid id)
    {
        await _productService.HideProductAsync(id);
        return Ok(ApiResponse.Success<object?>(null, "Đã ẩn sản phẩm."));
    }

    [HttpPost("{id:guid}/unhide")]
    public async Task<IActionResult> UnhideProduct(Guid id)
    {
        await _productService.UnhideProductAsync(id);
        return Ok(ApiResponse.Success<object?>(null, "Đã bỏ ẩn sản phẩm."));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        await _productService.AdminDeleteProductAsync(id);
        return Ok(ApiResponse.Success<object?>(null, "Đã xóa sản phẩm."));
    }

    private Guid GetUserId()
        => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException());
}

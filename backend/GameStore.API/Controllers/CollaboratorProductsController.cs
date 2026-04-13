using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GameStore.API.DTOs.Common;
using GameStore.API.DTOs.Products;
using GameStore.API.Models.Constants;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Controllers;

/// <summary>
/// Collaborator product CRUD — yêu cầu login + role Collaborator/Admin
/// </summary>
[ApiController]
[Route("api/v1/collaborator/products")]
[Authorize(Roles = "Collaborator,Admin")]
public class CollaboratorProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public CollaboratorProductsController(IProductService productService)
        => _productService = productService;

    [HttpGet]
    public async Task<IActionResult> GetMyProducts(
        [FromQuery] int page = AppConstants.DEFAULT_PAGE,
        [FromQuery] int pageSize = AppConstants.DEFAULT_PAGE_SIZE)
    {
        if (pageSize > AppConstants.MAX_PAGE_SIZE) pageSize = AppConstants.MAX_PAGE_SIZE;
        var result = await _productService.GetMyProductsAsync(GetUserId(), page, pageSize);
        return Ok(ApiResponse.Success(result.Items, result.ToPaginationMeta()));
    }

    /// <summary>
    /// Chi tiết sản phẩm của collaborator (bất kể trạng thái)
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetMyProductDetail(Guid id)
    {
        var result = await _productService.GetMyProductDetailAsync(GetUserId(), id);
        return Ok(ApiResponse.Success(result));
    }

    [HttpPost]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request)
    {
        var result = await _productService.CreateProductAsync(GetUserId(), request);
        return Created("", ApiResponse.Success(result, "Tạo sản phẩm thành công."));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] UpdateProductRequest request)
    {
        var result = await _productService.UpdateProductAsync(GetUserId(), id, request);
        return Ok(ApiResponse.Success(result, "Cập nhật sản phẩm thành công."));
    }

    [HttpPost("{id:guid}/submit")]
    public async Task<IActionResult> SubmitForApproval(Guid id)
    {
        await _productService.SubmitForApprovalAsync(GetUserId(), id);
        return Ok(ApiResponse.Success<object?>(null, "Đã gửi sản phẩm để duyệt."));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        await _productService.DeleteProductAsync(GetUserId(), id);
        return Ok(ApiResponse.Success<object?>(null, "Đã xóa sản phẩm."));
    }

    private Guid GetUserId()
        => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException());
}

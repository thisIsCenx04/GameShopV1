using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GameStore.API.DTOs.Common;
using GameStore.API.DTOs.Products;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Controllers;

/// <summary>
/// Public product browsing — không cần auth
/// </summary>
[ApiController]
[Route("api/v1/products")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
        => _productService = productService;

    /// <summary>
    /// Danh sách sản phẩm (public) với filter/search/sort
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetProducts([FromQuery] ProductFilterRequest filter)
    {
        var result = await _productService.GetProductsAsync(filter);
        return Ok(ApiResponse.Success(result.Items, result.ToPaginationMeta()));
    }

    /// <summary>
    /// Chi tiết sản phẩm (public) — tự động tăng view count
    /// </summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetProduct(Guid id)
    {
        var result = await _productService.GetProductDetailAsync(id);
        return Ok(ApiResponse.Success(result));
    }
}

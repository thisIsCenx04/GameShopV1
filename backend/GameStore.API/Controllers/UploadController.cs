using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GameStore.API.DTOs.Common;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Controllers;

/// <summary>
/// Upload endpoint — generates Cloudinary signed upload credentials
/// </summary>
[ApiController]
[Route("api/v1/upload")]
[Authorize]
public class UploadController : ControllerBase
{
    private readonly ICloudinaryService _cloudinaryService;

    public UploadController(ICloudinaryService cloudinaryService)
        => _cloudinaryService = cloudinaryService;

    /// <summary>
    /// Generate signed upload params for client-side direct upload to Cloudinary.
    /// Client will POST the file directly to Cloudinary CDN using these credentials.
    /// </summary>
    [HttpPost("sign")]
    public IActionResult GetUploadSignature()
    {
        var userId = GetUserId();
        var folder = $"gamestore/products/{userId}";

        var (signature, timestamp, apiKey, cloudName, signedFolder) =
            _cloudinaryService.GenerateUploadSignature(folder);

        return Ok(ApiResponse.Success(new
        {
            signature,
            timestamp,
            apiKey,
            cloudName,
            folder = signedFolder,
        }));
    }

    private Guid GetUserId()
        => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException());
}

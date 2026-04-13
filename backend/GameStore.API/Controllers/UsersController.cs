using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GameStore.API.DTOs.Common;
using GameStore.API.DTOs.Users;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Controllers;

[ApiController]
[Route("api/v1/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
        => _userService = userService;

    [HttpGet("me")]
    public async Task<IActionResult> GetProfile()
    {
        var result = await _userService.GetProfileAsync(GetUserId());
        return Ok(ApiResponse.Success(result));
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var result = await _userService.UpdateProfileAsync(GetUserId(), request);
        return Ok(ApiResponse.Success(result, "Cập nhật hồ sơ thành công."));
    }

    private Guid GetUserId()
        => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException());
}

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GameStore.API.DTOs.Auth;
using GameStore.API.DTOs.Common;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Controllers;

/// <summary>
/// RULE 03 — Controller chỉ điều hướng, không chứa business logic
/// </summary>
[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
        => _authService = authService;

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await _authService.RegisterAsync(request);
        return Created("", ApiResponse.Success(result, "Đăng ký thành công."));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        return Ok(ApiResponse.Success(result, "Đăng nhập thành công."));
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
    {
        var result = await _authService.RefreshTokenAsync(request);
        return Ok(ApiResponse.Success(result));
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        await _authService.ChangePasswordAsync(GetUserId(), request);
        return Ok(ApiResponse.Success<object?>(null, "Đổi mật khẩu thành công."));
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] RefreshRequest request)
    {
        await _authService.LogoutAsync(GetUserId(), request.RefreshToken);
        return Ok(ApiResponse.Success<object?>(null, "Đăng xuất thành công."));
    }

    private Guid GetUserId()
        => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException());
}

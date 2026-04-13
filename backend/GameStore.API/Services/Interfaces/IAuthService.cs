using GameStore.API.DTOs.Auth;

namespace GameStore.API.Services.Interfaces;

public interface IAuthService
{
    Task<TokenResponse> RegisterAsync(RegisterRequest request);
    Task<TokenResponse> LoginAsync(LoginRequest request);
    Task<TokenResponse> RefreshTokenAsync(RefreshRequest request);
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
    Task LogoutAsync(Guid userId, string refreshToken);
}

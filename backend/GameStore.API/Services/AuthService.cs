using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using GameStore.API.DTOs.Auth;
using GameStore.API.Exceptions;
using GameStore.API.Models.Constants;
using GameStore.API.Models.Entities;
using GameStore.API.Models.Enums;
using GameStore.API.Repositories.Interfaces;
using GameStore.API.Services.Interfaces;

namespace GameStore.API.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepo;
    private readonly IRefreshTokenRepository _refreshTokenRepo;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IUserRepository userRepo,
        IRefreshTokenRepository refreshTokenRepo,
        IConfiguration config,
        ILogger<AuthService> logger)
    {
        _userRepo = userRepo;
        _refreshTokenRepo = refreshTokenRepo;
        _config = config;
        _logger = logger;
    }

    public async Task<TokenResponse> RegisterAsync(RegisterRequest request)
    {
        // Check email uniqueness
        if (await _userRepo.EmailExistsAsync(request.Email))
            throw new ConflictException(ErrorMessages.EMAIL_ALREADY_EXISTS);

        // Create user with BCrypt hash — RULE 05: cost factor = 12
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email.ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, AppConstants.BCRYPT_COST_FACTOR),
            Role = UserRole.Customer,
            IsActive = true,
            EmailConfirmed = true, // Simplified for MVP — skip OTP verification
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _userRepo.AddAsync(user);

        // Create user profile
        var profile = new UserProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            FullName = request.FullName,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create wallet for user
        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Balance = 0,
            FrozenBalance = 0,
            Currency = "VND",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        user.Profile = profile;
        user.Wallet = wallet;

        await _userRepo.SaveChangesAsync();

        _logger.LogInformation("User registered: {Email} with Id {UserId}", user.Email, user.Id);

        // Generate tokens
        return await GenerateTokensAsync(user);
    }

    public async Task<TokenResponse> LoginAsync(LoginRequest request)
    {
        var user = await _userRepo.GetByEmailAsync(request.Email.ToLowerInvariant());

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new BusinessException(ErrorMessages.INVALID_CREDENTIALS);

        if (!user.IsActive)
            throw new BusinessException(ErrorMessages.ACCOUNT_DISABLED);

        _logger.LogInformation("User logged in: {Email}", user.Email);

        return await GenerateTokensAsync(user);
    }

    public async Task<TokenResponse> RefreshTokenAsync(RefreshRequest request)
    {
        var refreshToken = await _refreshTokenRepo.GetByTokenAsync(request.RefreshToken);

        if (refreshToken == null || !refreshToken.IsActive)
            throw new BusinessException(ErrorMessages.INVALID_REFRESH_TOKEN);

        // Rotation: revoke old token
        refreshToken.RevokedAt = DateTime.UtcNow;

        var user = refreshToken.User;
        if (!user.IsActive)
            throw new BusinessException(ErrorMessages.ACCOUNT_DISABLED);

        var tokens = await GenerateTokensAsync(user);
        await _refreshTokenRepo.SaveChangesAsync();

        _logger.LogInformation("Token refreshed for user: {UserId}", user.Id);

        return tokens;
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await _userRepo.GetByIdAsync(userId)
            ?? throw new NotFoundException(ErrorMessages.NOT_FOUND);

        if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash))
            throw new BusinessException("Mật khẩu cũ không đúng.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword, AppConstants.BCRYPT_COST_FACTOR);
        user.UpdatedAt = DateTime.UtcNow;

        // Revoke all existing refresh tokens
        await _refreshTokenRepo.RevokeAllByUserIdAsync(userId);
        await _userRepo.SaveChangesAsync();

        _logger.LogInformation("Password changed for user: {UserId}", userId);
    }

    public async Task LogoutAsync(Guid userId, string refreshToken)
    {
        var token = await _refreshTokenRepo.GetByTokenAsync(refreshToken);
        if (token != null && token.UserId == userId)
        {
            token.RevokedAt = DateTime.UtcNow;
            await _refreshTokenRepo.SaveChangesAsync();
        }

        _logger.LogInformation("User logged out: {UserId}", userId);
    }

    // ==================== Private Methods ====================

    private async Task<TokenResponse> GenerateTokensAsync(User user)
    {
        var jwtSettings = _config.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"]!;
        var expiryMinutes = int.Parse(jwtSettings["AccessTokenExpiryMinutes"] ?? "15");
        var refreshDays = int.Parse(jwtSettings["RefreshTokenExpiryDays"] ?? "7");

        // Generate Access Token
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var expiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials
        );

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);

        // Generate Refresh Token
        var refreshTokenString = GenerateRefreshToken();
        var refreshTokenEntity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshTokenString,
            ExpiresAt = DateTime.UtcNow.AddDays(refreshDays),
            CreatedAt = DateTime.UtcNow
        };

        await _refreshTokenRepo.AddAsync(refreshTokenEntity);
        await _refreshTokenRepo.SaveChangesAsync();

        return new TokenResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshTokenString,
            ExpiresAt = expiresAt
        };
    }

    private static string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }
}

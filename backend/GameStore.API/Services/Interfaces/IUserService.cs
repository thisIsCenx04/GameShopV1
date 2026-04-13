using GameStore.API.DTOs.Admin;
using GameStore.API.DTOs.Users;
using GameStore.API.DTOs.Common;

namespace GameStore.API.Services.Interfaces;

public interface IUserService
{
    Task<UserProfileResponse> GetProfileAsync(Guid userId);
    Task<UserProfileResponse> UpdateProfileAsync(Guid userId, UpdateProfileRequest request);
    Task<PagedResult<UserListResponse>> GetUsersAsync(int page, int pageSize);

    // Admin-specific
    Task<AdminUserDetailResponse> GetUserDetailForAdminAsync(Guid userId);
    Task<AdminUserDetailResponse> AdminUpdateUserAsync(Guid userId, AdminUpdateUserRequest request);
    Task AdjustWalletAsync(Guid adminId, Guid userId, AdminAdjustWalletRequest request);
}

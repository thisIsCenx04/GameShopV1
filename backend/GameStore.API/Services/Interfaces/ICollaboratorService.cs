using GameStore.API.DTOs.Admin;

namespace GameStore.API.Services.Interfaces;

public interface ICollaboratorService
{
    Task GrantCollaboratorRoleAsync(Guid adminId, Guid userId, GrantCollaboratorRequest request);
    Task RevokeCollaboratorRoleAsync(Guid adminId, Guid userId);
    Task ChangeUserRoleAsync(Guid adminId, Guid userId, ChangeUserRoleRequest request);
    Task SuspendUserAsync(Guid userId);
    Task ActivateUserAsync(Guid userId);
}

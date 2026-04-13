using AutoMapper;
using GameStore.API.DTOs.Users;
using GameStore.API.Models.Entities;

namespace GameStore.API.Mappings;

public class UserMappingProfile : Profile
{
    public UserMappingProfile()
    {
        CreateMap<User, UserProfileResponse>()
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.Profile != null ? src.Profile.FullName : null))
            .ForMember(dest => dest.AvatarUrl, opt => opt.MapFrom(src => src.Profile != null ? src.Profile.AvatarUrl : null))
            .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.Profile != null ? src.Profile.PhoneNumber : null))
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role.ToString()));

        CreateMap<User, UserListResponse>()
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.Profile != null ? src.Profile.FullName : null))
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role.ToString()));
    }
}

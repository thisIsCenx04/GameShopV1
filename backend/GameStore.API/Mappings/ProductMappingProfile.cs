using AutoMapper;
using GameStore.API.DTOs.Products;
using GameStore.API.Models.Entities;

namespace GameStore.API.Mappings;

public class ProductMappingProfile : Profile
{
    public ProductMappingProfile()
    {
        CreateMap<ProductListing, ProductListResponse>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.MainImageUrl, opt => opt.MapFrom(src =>
                src.Images.FirstOrDefault(i => i.IsMain) != null
                    ? src.Images.First(i => i.IsMain).ImageUrl
                    : src.Images.FirstOrDefault() != null
                        ? src.Images.First().ImageUrl
                        : null))
            .ForMember(dest => dest.GameName, opt => opt.MapFrom(src => src.Game.Name))
            .ForMember(dest => dest.GameRankName, opt => opt.MapFrom(src => src.GameRank.Name))
            .ForMember(dest => dest.GameServerName, opt => opt.MapFrom(src => src.GameServer != null ? src.GameServer.Name : null))
            .ForMember(dest => dest.GameCategoryName, opt => opt.MapFrom(src => src.GameCategory != null ? src.GameCategory.Name : null))
            .ForMember(dest => dest.CollaboratorName, opt => opt.MapFrom(src =>
                src.Collaborator.Profile != null ? src.Collaborator.Profile.FullName : src.Collaborator.Email));

        CreateMap<ProductListing, ProductDetailResponse>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.GameName, opt => opt.MapFrom(src => src.Game.Name))
            .ForMember(dest => dest.GameRankName, opt => opt.MapFrom(src => src.GameRank.Name))
            .ForMember(dest => dest.GameServerName, opt => opt.MapFrom(src => src.GameServer != null ? src.GameServer.Name : null))
            .ForMember(dest => dest.GameCategoryName, opt => opt.MapFrom(src => src.GameCategory != null ? src.GameCategory.Name : null))
            .ForMember(dest => dest.CollaboratorName, opt => opt.MapFrom(src =>
                src.Collaborator.Profile != null ? src.Collaborator.Profile.FullName : src.Collaborator.Email))
            .ForMember(dest => dest.Images, opt => opt.MapFrom(src => src.Images.OrderBy(i => i.SortOrder)))
            .ForMember(dest => dest.Tags, opt => opt.MapFrom(src => src.ProductListingTags.Select(pt => pt.Tag)));

        CreateMap<ProductImage, ProductImageDto>();
        CreateMap<Tag, TagDto>();
    }
}

using AutoMapper;
using GameStore.API.DTOs.Games;
using GameStore.API.Models.Entities;

namespace GameStore.API.Mappings;

public class GameMappingProfile : Profile
{
    public GameMappingProfile()
    {
        CreateMap<Game, GameResponse>()
            .ForMember(dest => dest.Ranks, opt => opt.MapFrom(src => src.GameRanks))
            .ForMember(dest => dest.Servers, opt => opt.MapFrom(src => src.GameServers))
            .ForMember(dest => dest.Categories, opt => opt.MapFrom(src => src.GameCategories));

        CreateMap<GameRank, GameRankResponse>();
        CreateMap<GameServer, GameServerResponse>();
        
        CreateMap<GameCategory, GameCategoryResponse>()
            .ForMember(dest => dest.ProductCount, opt => opt.MapFrom(src => src.ProductListings != null ? src.ProductListings.Count(p => p.Status == GameStore.API.Models.Enums.ProductStatus.Active) : 0))
            .ForMember(dest => dest.SoldCount, opt => opt.MapFrom(src => src.ProductListings != null ? src.ProductListings.Count(p => p.Status == GameStore.API.Models.Enums.ProductStatus.Sold) : 0));
    }
}

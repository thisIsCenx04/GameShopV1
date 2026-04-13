namespace GameStore.API.DTOs.Games;

public class GameResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public int DisplayOrder { get; set; }
    public List<GameRankResponse> Ranks { get; set; } = new();
    public List<GameServerResponse> Servers { get; set; } = new();
    public List<GameCategoryResponse> Categories { get; set; } = new();
}

public class GameCategoryResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    public int DisplayOrder { get; set; }
    public int ProductCount { get; set; }
    public int SoldCount { get; set; }
}

public class GameRankResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public int Order { get; set; }
}

public class GameServerResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class CreateGameRequest
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public int DisplayOrder { get; set; }
}

public class UpdateGameRequest
{
    public string? Name { get; set; }
    public string? Slug { get; set; }
    public string? IconUrl { get; set; }
    public int? DisplayOrder { get; set; }
    public bool? IsActive { get; set; }
}

public class CreateGameRankRequest
{
    public string Name { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public int Order { get; set; }
}

public class CreateGameServerRequest
{
    public string Name { get; set; } = string.Empty;
}

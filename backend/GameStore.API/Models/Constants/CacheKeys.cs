namespace GameStore.API.Models.Constants;

/// <summary>
/// Cache key templates theo RULE 07
/// </summary>
public static class CacheKeys
{
    public const string PRODUCT_BY_ID = "product:{0}";
    public const string PRODUCTS_SEARCH = "products:search:{0}";
    public const string GAMES_ALL = "games:all";
    public const string COLLABORATOR_STATS = "collaborator:stats:{0}";
    public const string WALLET_BALANCE = "wallet:balance:{0}";
    public const string SESSION = "session:{0}";
    public const string PRODUCT_LOCK = "product:lock:{0}";

    // TTL constants (in seconds)
    public const int PRODUCT_TTL = 300;         // 5 phút
    public const int SEARCH_TTL = 120;          // 2 phút
    public const int GAMES_TTL = 3600;          // 1 giờ
    public const int COLLAB_STATS_TTL = 900;    // 15 phút
    public const int WALLET_BALANCE_TTL = 30;   // 30 giây
    public const int PRODUCT_LOCK_TTL = 300;    // 5 phút
}

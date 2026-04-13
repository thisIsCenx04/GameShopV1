namespace GameStore.API.Models.Constants;

/// <summary>
/// Hằng số ứng dụng
/// </summary>
public static class AppConstants
{
    public const int MAX_IMAGE_COUNT = 10;
    public const int BCRYPT_COST_FACTOR = 12;
    public const int OTP_LENGTH = 6;
    public const int OTP_EXPIRY_MINUTES = 10;
    public const int ORDER_EXPIRY_MINUTES = 5;
    public const int AUTO_COMPLETE_HOURS = 24;
    public const int DISPUTE_WINDOW_HOURS = 24;
    public const decimal MIN_WITHDRAW_AMOUNT = 100_000m;
    public const int PASSWORD_RESET_EXPIRY_MINUTES = 15;
    public const int NOTIFICATION_HISTORY_DAYS = 30;

    // Rate limiting
    public const int ANONYMOUS_RATE_LIMIT = 100;   // req/phút
    public const int AUTH_RATE_LIMIT = 500;         // req/phút

    // Pagination defaults
    public const int DEFAULT_PAGE = 1;
    public const int DEFAULT_PAGE_SIZE = 20;
    public const int MAX_PAGE_SIZE = 100;
}

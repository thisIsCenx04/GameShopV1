namespace GameStore.API.Models.Constants;

/// <summary>
/// Thông báo lỗi chuẩn
/// </summary>
public static class ErrorMessages
{
    // Auth
    public const string EMAIL_ALREADY_EXISTS = "Email đã được sử dụng.";
    public const string INVALID_CREDENTIALS = "Email hoặc mật khẩu không đúng.";
    public const string ACCOUNT_DISABLED = "Tài khoản đã bị vô hiệu hóa.";
    public const string EMAIL_NOT_CONFIRMED = "Email chưa được xác thực.";
    public const string INVALID_REFRESH_TOKEN = "Refresh token không hợp lệ hoặc đã hết hạn.";
    public const string INVALID_OTP = "Mã OTP không hợp lệ hoặc đã hết hạn.";

    // Authorization
    public const string NOT_COLLABORATOR = "Tài khoản chưa được cấp quyền Collaborator bởi Admin.";
    public const string FORBIDDEN = "Bạn không có quyền thực hiện hành động này.";
    public const string UNAUTHORIZED = "Vui lòng đăng nhập để tiếp tục.";

    // Products
    public const string PRODUCT_NOT_FOUND = "Sản phẩm không tồn tại.";
    public const string PRODUCT_NOT_ACTIVE = "Sản phẩm không khả dụng.";
    public const string PRODUCT_ALREADY_SOLD = "Sản phẩm đã được bán.";
    public const string MAX_IMAGES_EXCEEDED = "Tối đa 10 ảnh cho mỗi sản phẩm.";

    // Orders
    public const string ORDER_NOT_FOUND = "Đơn hàng không tồn tại.";
    public const string PRODUCT_BEING_PROCESSED = "Sản phẩm đang được xử lý, vui lòng thử lại.";
    public const string INSUFFICIENT_BALANCE = "Số dư ví không đủ.";
    public const string CANNOT_BUY_OWN_PRODUCT = "Không thể mua sản phẩm của chính mình.";

    // Wallet
    public const string WALLET_NOT_FOUND = "Ví không tồn tại.";
    public const string MIN_WITHDRAW_AMOUNT = "Số tiền rút tối thiểu 100,000 VND.";
    public const string PENDING_WITHDRAW_EXISTS = "Bạn đã có yêu cầu rút tiền đang xử lý.";

    // General
    public const string VALIDATION_FAILED = "Dữ liệu không hợp lệ.";
    public const string NOT_FOUND = "Không tìm thấy tài nguyên yêu cầu.";
    public const string INTERNAL_ERROR = "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.";
}

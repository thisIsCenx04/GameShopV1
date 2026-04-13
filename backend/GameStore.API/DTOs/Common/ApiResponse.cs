namespace GameStore.API.DTOs.Common;

/// <summary>
/// Wrapper chuẩn cho mọi API response - RULE 04
/// </summary>
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public List<string> Errors { get; set; } = new();
    public PaginationMeta? Meta { get; set; }

    public static ApiResponse<T> SuccessResponse(T data, string? message = null)
        => new() { Success = true, Data = data, Message = message };

    public static ApiResponse<T> SuccessResponse(T data, PaginationMeta meta)
        => new() { Success = true, Data = data, Meta = meta };

    public static ApiResponse<T> FailResponse(string message, List<string>? errors = null)
        => new() { Success = false, Message = message, Errors = errors ?? new() };
}

/// <summary>
/// Non-generic version for convenience
/// </summary>
public static class ApiResponse
{
    public static ApiResponse<T> Success<T>(T data, string? message = null)
        => ApiResponse<T>.SuccessResponse(data, message);

    public static ApiResponse<T> Success<T>(T data, PaginationMeta meta)
        => ApiResponse<T>.SuccessResponse(data, meta);

    public static ApiResponse<object> Fail(string message, List<string>? errors = null)
        => ApiResponse<object>.FailResponse(message, errors);
}

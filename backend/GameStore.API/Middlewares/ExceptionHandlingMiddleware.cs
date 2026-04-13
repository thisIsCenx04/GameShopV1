using System.Net;
using System.Text.Json;
using GameStore.API.DTOs.Common;
using GameStore.API.Exceptions;
using GameStore.API.Models.Constants;

namespace GameStore.API.Middlewares;

/// <summary>
/// Bắt exception toàn cục, log Serilog, trả lỗi chuẩn — RULE 12
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        var (statusCode, message) = ex switch
        {
            BusinessException => (HttpStatusCode.UnprocessableEntity, ex.Message),
            NotFoundException => (HttpStatusCode.NotFound, ex.Message),
            ConflictException => (HttpStatusCode.Conflict, ex.Message),
            ForbiddenException => (HttpStatusCode.Forbidden, ex.Message),
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, ErrorMessages.UNAUTHORIZED),
            _ => (HttpStatusCode.InternalServerError, ErrorMessages.INTERNAL_ERROR)
        };

        if (statusCode == HttpStatusCode.InternalServerError)
        {
            _logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
        }
        else
        {
            _logger.LogWarning("Handled exception {ExceptionType}: {Message}", ex.GetType().Name, ex.Message);
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = ApiResponse.Fail(message);
        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}

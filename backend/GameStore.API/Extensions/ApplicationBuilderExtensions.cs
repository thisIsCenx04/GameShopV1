using GameStore.API.Middlewares;

namespace GameStore.API.Extensions;

public static class ApplicationBuilderExtensions
{
    public static IApplicationBuilder UseGameStoreMiddleware(this IApplicationBuilder app)
    {
        app.UseMiddleware<RequestLoggingMiddleware>();
        app.UseMiddleware<ExceptionHandlingMiddleware>();

        return app;
    }
}

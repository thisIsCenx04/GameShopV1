using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using FluentValidation;
using FluentValidation.AspNetCore;
using GameStore.API.Repositories.Data;
using GameStore.API.Repositories;
using GameStore.API.Repositories.Interfaces;

namespace GameStore.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration config)
    {
        // Build connection string from env vars, fallback to appsettings
        var server = Environment.GetEnvironmentVariable("DB_SERVER") ?? "localhost";
        var dbName = Environment.GetEnvironmentVariable("DB_NAME") ?? "GameStoreVN";
        var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? "sa";
        var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "";
        var connString = config.GetConnectionString("DefaultConnection")
            ?? $"Server={server};Database={dbName};User Id={dbUser};Password={dbPassword};TrustServerCertificate=True;MultipleActiveResultSets=true";

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(
                connString,
                sqlOptions => sqlOptions.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)
            ));

        return services;
    }

    public static IServiceCollection AddRepositories(this IServiceCollection services)
    {
        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();

        return services;
    }

    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<Services.Interfaces.IAuthService, Services.AuthService>();
        services.AddScoped<Services.Interfaces.IUserService, Services.UserService>();
        services.AddScoped<Services.Interfaces.ICollaboratorService, Services.CollaboratorService>();
        services.AddScoped<Services.Interfaces.IProductService, Services.ProductService>();
        services.AddScoped<Services.Interfaces.IGameService, Services.GameService>();
        services.AddScoped<Services.Interfaces.IOrderService, Services.OrderService>();
        services.AddScoped<Services.Interfaces.IWalletService, Services.WalletService>();
        services.AddScoped<Services.Interfaces.IDisputeService, Services.DisputeService>();
        services.AddScoped<Services.Interfaces.IReviewService, Services.ReviewService>();
        services.AddScoped<Services.Interfaces.INotificationService, Services.NotificationService>();
        services.AddSingleton<Services.Interfaces.ICloudinaryService, Services.CloudinaryService>();

        return services;
    }

    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration config)
    {
        var jwtSettings = config.GetSection("JwtSettings");
        var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
            ?? jwtSettings["SecretKey"]
            ?? throw new InvalidOperationException("JWT SecretKey is not configured");
        var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? jwtSettings["Issuer"] ?? "GameStoreVN";
        var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? jwtSettings["Audience"] ?? "GameStoreVN";

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = issuer,
                ValidAudience = audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
                ClockSkew = TimeSpan.Zero
            };
        });

        services.AddAuthorization();
        return services;
    }

    public static IServiceCollection AddValidation(this IServiceCollection services)
    {
        services.AddFluentValidationAutoValidation();
        services.AddValidatorsFromAssemblyContaining<Program>();

        services.Configure<Microsoft.AspNetCore.Mvc.ApiBehaviorOptions>(options =>
        {
            options.InvalidModelStateResponseFactory = context =>
            {
                var errors = context.ModelState
                    .Where(e => e.Value != null && e.Value.Errors.Count > 0)
                    .SelectMany(x => x.Value!.Errors)
                    .Select(x => x.ErrorMessage)
                    .ToList();

                var response = GameStore.API.DTOs.Common.ApiResponse.Fail(string.Join(". ", errors));
                
                return new Microsoft.AspNetCore.Mvc.UnprocessableEntityObjectResult(response);
            };
        });

        return services;
    }

    public static IServiceCollection AddSwaggerDocumentation(this IServiceCollection services)
    {
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "GameStore VN API",
                Version = "v1",
                Description = "API cho hệ thống mua bán tài khoản game GameStore VN"
            });

            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Nhập JWT token: Bearer {token}"
            });

            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });

        return services;
    }

    public static IServiceCollection AddCorsPolicy(this IServiceCollection services, IConfiguration config)
    {
        // Read from env var CORS_ORIGINS (comma-separated), fallback to appsettings
        var envOrigins = Environment.GetEnvironmentVariable("CORS_ORIGINS");
        var allowedOrigins = !string.IsNullOrEmpty(envOrigins)
            ? envOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            : config.GetSection("Cors:AllowedOrigins").Get<string[]>()
              ?? new[] { "http://localhost:3000" };

        services.AddCors(options =>
        {
            options.AddPolicy("GameStoreCors", builder =>
            {
                builder.WithOrigins(allowedOrigins)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        return services;
    }

    public static IServiceCollection AddAutoMapperProfiles(this IServiceCollection services)
    {
        services.AddAutoMapper(typeof(Program).Assembly);
        return services;
    }
}

using Microsoft.EntityFrameworkCore;
using GameStore.API.Models.Entities;
using GameStore.API.Models.Enums;
using GameStore.API.Models.Constants;

namespace GameStore.API.Repositories.Data;

public static class SeedData
{
    public static void SeedDatabase(AppDbContext context)
    {
        if (context.Users.Any()) return; // Already seeded

        // ============== Admin Account ==============
        var adminId = Guid.NewGuid();
        var admin = new User
        {
            Id = adminId,
            Email = "admin@gamestore.vn",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@2026", AppConstants.BCRYPT_COST_FACTOR),
            Role = UserRole.Admin,
            IsActive = true,
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var adminProfile = new UserProfile
        {
            Id = Guid.NewGuid(),
            UserId = adminId,
            FullName = "System Administrator",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var adminWallet = new Wallet
        {
            Id = Guid.NewGuid(),
            UserId = adminId,
            Balance = 0,
            FrozenBalance = 0,
            Currency = "VND",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Users.Add(admin);
        context.UserProfiles.Add(adminProfile);
        context.Wallets.Add(adminWallet);

        // ============== Games ==============
        var games = new[]
        {
            new Game { Name = "Liên Quân Mobile", Slug = "lien-quan-mobile", IsActive = true, DisplayOrder = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Game { Name = "Free Fire", Slug = "free-fire", IsActive = true, DisplayOrder = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Game { Name = "PUBG Mobile", Slug = "pubg-mobile", IsActive = true, DisplayOrder = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Game { Name = "Genshin Impact", Slug = "genshin-impact", IsActive = true, DisplayOrder = 4, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Game { Name = "Valorant", Slug = "valorant", IsActive = true, DisplayOrder = 5, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Game { Name = "League of Legends", Slug = "league-of-legends", IsActive = true, DisplayOrder = 6, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };
        context.Games.AddRange(games);
        context.SaveChanges();

        // ============== GameRanks (Liên Quân) ==============
        var lienQuanId = context.Games.First(g => g.Slug == "lien-quan-mobile").Id;
        var ranks = new[]
        {
            new GameRank { GameId = lienQuanId, Name = "Đồng", Order = 1, CreatedAt = DateTime.UtcNow },
            new GameRank { GameId = lienQuanId, Name = "Bạc", Order = 2, CreatedAt = DateTime.UtcNow },
            new GameRank { GameId = lienQuanId, Name = "Vàng", Order = 3, CreatedAt = DateTime.UtcNow },
            new GameRank { GameId = lienQuanId, Name = "Bạch Kim", Order = 4, CreatedAt = DateTime.UtcNow },
            new GameRank { GameId = lienQuanId, Name = "Kim Cương", Order = 5, CreatedAt = DateTime.UtcNow },
            new GameRank { GameId = lienQuanId, Name = "Cao Thủ", Order = 6, CreatedAt = DateTime.UtcNow },
            new GameRank { GameId = lienQuanId, Name = "Thách Đấu", Order = 7, CreatedAt = DateTime.UtcNow }
        };
        context.GameRanks.AddRange(ranks);

        // ============== GameRanks (Free Fire) ==============
        var ffId = context.Games.First(g => g.Slug == "free-fire").Id;
        var ffRanks = new[]
        {
            new GameRank { GameId = ffId, Name = "Đồng", Order = 1, CreatedAt = DateTime.UtcNow },
            new GameRank { GameId = ffId, Name = "Bạc", Order = 2, CreatedAt = DateTime.UtcNow },
            new GameRank { GameId = ffId, Name = "Vàng", Order = 3, CreatedAt = DateTime.UtcNow },
            new GameRank { GameId = ffId, Name = "Bạch Kim", Order = 4, CreatedAt = DateTime.UtcNow },
            new GameRank { GameId = ffId, Name = "Kim Cương", Order = 5, CreatedAt = DateTime.UtcNow },
            new GameRank { GameId = ffId, Name = "Anh Hùng", Order = 6, CreatedAt = DateTime.UtcNow },
            new GameRank { GameId = ffId, Name = "Thách Đấu", Order = 7, CreatedAt = DateTime.UtcNow }
        };
        context.GameRanks.AddRange(ffRanks);

        // ============== GameServers ==============
        context.GameServers.AddRange(new[]
        {
            new GameServer { GameId = lienQuanId, Name = "VN", IsActive = true, CreatedAt = DateTime.UtcNow },
            new GameServer { GameId = ffId, Name = "VN", IsActive = true, CreatedAt = DateTime.UtcNow },
        });

        // ============== Tags ==============
        context.Tags.AddRange(new[]
        {
            new Tag { Name = "Fullskill", Slug = "fullskill", CreatedAt = DateTime.UtcNow },
            new Tag { Name = "Nhiều Tướng", Slug = "nhieu-tuong", CreatedAt = DateTime.UtcNow },
            new Tag { Name = "Rare Skin", Slug = "rare-skin", CreatedAt = DateTime.UtcNow },
            new Tag { Name = "Full Trang Phục", Slug = "full-trang-phuc", CreatedAt = DateTime.UtcNow },
            new Tag { Name = "Giá Rẻ", Slug = "gia-re", CreatedAt = DateTime.UtcNow },
            new Tag { Name = "VIP", Slug = "vip", CreatedAt = DateTime.UtcNow }
        });

        // ============== Default Commission Rule ==============
        context.CommissionRules.Add(new CommissionRule
        {
            AdminFeeRate = 0.15m, // 15% Admin Fee mặc định
            EffectiveFrom = DateTime.UtcNow,
            Priority = 10, // Mặc định toàn hệ thống
            CreatedAt = DateTime.UtcNow
        });

        context.SaveChanges();
    }
}

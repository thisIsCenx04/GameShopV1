using Microsoft.EntityFrameworkCore;
using GameStore.API.Models.Entities;
using GameStore.API.Models.Enums;

namespace GameStore.API.Repositories.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Auth group
    public DbSet<User> Users => Set<User>();
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<OtpCode> OtpCodes => Set<OtpCode>();

    // Catalog group
    public DbSet<Game> Games => Set<Game>();
    public DbSet<GameRank> GameRanks => Set<GameRank>();
    public DbSet<GameServer> GameServers => Set<GameServer>();
    public DbSet<GameCategory> GameCategories => Set<GameCategory>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<ProductListing> ProductListings => Set<ProductListing>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<ProductListingTag> ProductListingTags => Set<ProductListingTag>();
    public DbSet<ProductCategory> ProductCategories => Set<ProductCategory>();

    // Transaction group
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderStatusLog> OrderStatusLogs => Set<OrderStatusLog>();
    public DbSet<AccountDelivery> AccountDeliveries => Set<AccountDelivery>();
    public DbSet<Dispute> Disputes => Set<Dispute>();
    public DbSet<DisputeAttachment> DisputeAttachments => Set<DisputeAttachment>();

    // Finance group
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>();
    public DbSet<PaymentRequest> PaymentRequests => Set<PaymentRequest>();
    public DbSet<WithdrawRequest> WithdrawRequests => Set<WithdrawRequest>();
    public DbSet<CommissionRule> CommissionRules => Set<CommissionRule>();
    public DbSet<CommissionLedger> CommissionLedgers => Set<CommissionLedger>();
    public DbSet<InsuranceDeposit> InsuranceDeposits => Set<InsuranceDeposit>();
    public DbSet<CollaboratorContract> CollaboratorContracts => Set<CollaboratorContract>();

    // Social group
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<CollaboratorStats> CollaboratorStats => Set<CollaboratorStats>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<NotificationTemplate> NotificationTemplates => Set<NotificationTemplate>();

    // CMS group
    public DbSet<Banner> Banners => Set<Banner>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}

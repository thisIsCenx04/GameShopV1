using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GameStore.API.Models.Entities;
using GameStore.API.Models.Enums;

namespace GameStore.API.Repositories.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).HasDefaultValueSql("NEWID()");
        builder.Property(u => u.Email).HasMaxLength(256).IsRequired();
        builder.HasIndex(u => u.Email).IsUnique();
        builder.Property(u => u.PasswordHash).HasMaxLength(256).IsRequired();
        builder.Property(u => u.Role).HasConversion<byte>().IsRequired();
        builder.Property(u => u.IsActive).HasDefaultValue(true);
        builder.Property(u => u.EmailConfirmed).HasDefaultValue(false);
        builder.Property(u => u.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        builder.Property(u => u.UpdatedAt).IsRequired();

        builder.HasOne(u => u.Profile)
            .WithOne(p => p.User)
            .HasForeignKey<UserProfile>(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(u => u.Wallet)
            .WithOne(w => w.User)
            .HasForeignKey<Wallet>(w => w.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(u => u.CollaboratorStats)
            .WithOne(cs => cs.User)
            .HasForeignKey<CollaboratorStats>(cs => cs.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class UserProfileConfiguration : IEntityTypeConfiguration<UserProfile>
{
    public void Configure(EntityTypeBuilder<UserProfile> builder)
    {
        builder.ToTable("UserProfiles");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasDefaultValueSql("NEWID()");
        builder.Property(p => p.FullName).HasMaxLength(200);
        builder.Property(p => p.AvatarUrl).HasMaxLength(500);
        builder.Property(p => p.PhoneNumber).HasMaxLength(20);
        builder.Property(p => p.BankAccountName).HasMaxLength(200);
        builder.Property(p => p.BankAccountNumber).HasMaxLength(30);
        builder.Property(p => p.BankName).HasMaxLength(200);
        builder.Property(p => p.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        builder.Property(p => p.UpdatedAt).IsRequired();
    }
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasDefaultValueSql("NEWID()");
        builder.Property(r => r.Token).HasMaxLength(500).IsRequired();
        builder.HasIndex(r => r.Token).IsUnique().HasDatabaseName("UIX_RefreshTokens_Token");
        builder.Property(r => r.IpAddress).HasMaxLength(45);
        builder.Property(r => r.ExpiresAt).IsRequired();
        builder.Property(r => r.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.Ignore(r => r.IsExpired);
        builder.Ignore(r => r.IsRevoked);
        builder.Ignore(r => r.IsActive);

        builder.HasOne(r => r.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class OtpCodeConfiguration : IEntityTypeConfiguration<OtpCode>
{
    public void Configure(EntityTypeBuilder<OtpCode> builder)
    {
        builder.ToTable("OtpCodes");
        builder.HasKey(o => o.Id);
        builder.Property(o => o.Id).HasDefaultValueSql("NEWID()");
        builder.Property(o => o.Code).HasMaxLength(256).IsRequired();
        builder.Property(o => o.Purpose).HasMaxLength(20).IsRequired();
        builder.Property(o => o.ExpiresAt).IsRequired();
        builder.Property(o => o.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.Ignore(o => o.IsExpired);
        builder.Ignore(o => o.IsUsed);

        builder.HasOne(o => o.User)
            .WithMany(u => u.OtpCodes)
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

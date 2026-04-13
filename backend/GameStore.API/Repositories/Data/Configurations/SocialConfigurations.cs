using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GameStore.API.Models.Entities;

namespace GameStore.API.Repositories.Data.Configurations;

public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.ToTable("Reviews");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasDefaultValueSql("NEWID()");
        builder.Property(r => r.Rating).IsRequired();
        builder.Property(r => r.Comment).HasMaxLength(2000);
        builder.Property(r => r.IsVisible).HasDefaultValue(true);
        builder.Property(r => r.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        builder.Property(r => r.UpdatedAt).IsRequired();

        builder.HasOne(r => r.Reviewer)
            .WithMany()
            .HasForeignKey(r => r.ReviewerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class CollaboratorStatsConfiguration : IEntityTypeConfiguration<CollaboratorStats>
{
    public void Configure(EntityTypeBuilder<CollaboratorStats> builder)
    {
        builder.ToTable("CollaboratorStats");
        builder.HasKey(s => s.UserId);
        builder.Property(s => s.TotalSold).HasDefaultValue(0);
        builder.Property(s => s.AvgRating).HasColumnType("DECIMAL(3,2)").HasDefaultValue(0m);
        builder.Property(s => s.DisputeRate).HasColumnType("DECIMAL(5,4)").HasDefaultValue(0m);
        builder.Property(s => s.ReputationScore).HasColumnType("DECIMAL(7,2)").HasDefaultValue(0m);
        builder.Property(s => s.BadgeLevel).HasMaxLength(50).HasDefaultValue("New");
        builder.Property(s => s.UpdatedAt).IsRequired();
    }
}

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");
        builder.HasKey(n => n.Id);
        builder.Property(n => n.Id).HasDefaultValueSql("NEWID()");
        builder.Property(n => n.Type).HasMaxLength(50).IsRequired();
        builder.Property(n => n.Title).HasMaxLength(200).IsRequired();
        builder.Property(n => n.Body).HasMaxLength(2000).IsRequired();
        builder.Property(n => n.IsRead).HasDefaultValue(false);
        builder.Property(n => n.MetaJson).HasColumnType("NVARCHAR(MAX)");
        builder.Property(n => n.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        // Required index per RULE 06
        builder.HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAt })
            .IsDescending(false, false, true)
            .HasDatabaseName("IX_Notifications_UserId_IsRead_CreatedAt");

        builder.HasOne(n => n.User)
            .WithMany(u => u.Notifications)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class NotificationTemplateConfiguration : IEntityTypeConfiguration<NotificationTemplate>
{
    public void Configure(EntityTypeBuilder<NotificationTemplate> builder)
    {
        builder.ToTable("NotificationTemplates");
        builder.HasKey(t => t.TemplateKey);
        builder.Property(t => t.TemplateKey).HasMaxLength(50);
        builder.Property(t => t.Subject).HasMaxLength(200).IsRequired();
        builder.Property(t => t.BodyTemplate).HasColumnType("NVARCHAR(MAX)").IsRequired();
        builder.Property(t => t.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        builder.Property(t => t.UpdatedAt).IsRequired();
    }
}

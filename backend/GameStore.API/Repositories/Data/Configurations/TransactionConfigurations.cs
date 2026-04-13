using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GameStore.API.Models.Entities;
using GameStore.API.Models.Enums;

namespace GameStore.API.Repositories.Data.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");
        builder.HasKey(o => o.Id);
        builder.Property(o => o.Id).HasDefaultValueSql("NEWID()");
        builder.Property(o => o.OrderCode).HasMaxLength(20).IsRequired();
        builder.HasIndex(o => o.OrderCode).IsUnique();
        builder.Property(o => o.Amount).HasColumnType("DECIMAL(18,0)").IsRequired();
        builder.Property(o => o.CollaboratorEarning).HasColumnType("DECIMAL(18,0)").IsRequired();
        builder.Property(o => o.AdminFee).HasColumnType("DECIMAL(18,0)").IsRequired();
        builder.Property(o => o.PaymentMethod).HasMaxLength(50).IsRequired();
        builder.Property(o => o.Status).HasConversion<byte>().HasDefaultValue(OrderStatus.Pending);
        builder.Property(o => o.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        builder.Property(o => o.UpdatedAt).IsRequired();

        // Required indexes per RULE 06
        builder.HasIndex(o => new { o.BuyerId, o.Status })
            .HasDatabaseName("IX_Orders_BuyerId_Status");
        builder.HasIndex(o => o.ListingId)
            .HasDatabaseName("IX_Orders_ListingId");

        builder.HasOne(o => o.Buyer)
            .WithMany(u => u.Orders)
            .HasForeignKey(o => o.BuyerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.Listing)
            .WithMany(p => p.Orders)
            .HasForeignKey(o => o.ListingId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.AccountDelivery)
            .WithOne(d => d.Order)
            .HasForeignKey<AccountDelivery>(d => d.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(o => o.Review)
            .WithOne(r => r.Order)
            .HasForeignKey<Review>(r => r.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class OrderStatusLogConfiguration : IEntityTypeConfiguration<OrderStatusLog>
{
    public void Configure(EntityTypeBuilder<OrderStatusLog> builder)
    {
        builder.ToTable("OrderStatusLogs");
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Id).UseIdentityColumn();
        builder.Property(l => l.OldStatus).HasConversion<byte>();
        builder.Property(l => l.NewStatus).HasConversion<byte>();
        builder.Property(l => l.Note).HasMaxLength(500);
        builder.Property(l => l.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(l => l.Order)
            .WithMany(o => o.StatusLogs)
            .HasForeignKey(l => l.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class AccountDeliveryConfiguration : IEntityTypeConfiguration<AccountDelivery>
{
    public void Configure(EntityTypeBuilder<AccountDelivery> builder)
    {
        builder.ToTable("AccountDeliveries");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).HasDefaultValueSql("NEWID()");
        builder.Property(d => d.EncryptedUsername).HasMaxLength(1000).IsRequired();
        builder.Property(d => d.EncryptedPassword).HasMaxLength(1000).IsRequired();
        builder.Property(d => d.EncryptedNotes).HasMaxLength(2000);
        builder.Property(d => d.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
    }
}

public class DisputeConfiguration : IEntityTypeConfiguration<Dispute>
{
    public void Configure(EntityTypeBuilder<Dispute> builder)
    {
        builder.ToTable("Disputes");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).HasDefaultValueSql("NEWID()");
        builder.Property(d => d.Reason).HasMaxLength(1000).IsRequired();
        builder.Property(d => d.Status).HasMaxLength(20).IsRequired();
        builder.Property(d => d.AdminNote).HasMaxLength(2000);
        builder.Property(d => d.Resolution).HasMaxLength(2000);
        builder.Property(d => d.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        builder.Property(d => d.UpdatedAt).IsRequired();

        builder.HasOne(d => d.Order)
            .WithMany(o => o.Disputes)
            .HasForeignKey(d => d.OrderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.Reporter)
            .WithMany()
            .HasForeignKey(d => d.ReporterId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class DisputeAttachmentConfiguration : IEntityTypeConfiguration<DisputeAttachment>
{
    public void Configure(EntityTypeBuilder<DisputeAttachment> builder)
    {
        builder.ToTable("DisputeAttachments");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasDefaultValueSql("NEWID()");
        builder.Property(a => a.FileUrl).HasMaxLength(500).IsRequired();
        builder.Property(a => a.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(a => a.Dispute)
            .WithMany(d => d.Attachments)
            .HasForeignKey(a => a.DisputeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

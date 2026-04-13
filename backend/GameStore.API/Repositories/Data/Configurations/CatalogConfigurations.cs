using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GameStore.API.Models.Entities;
using GameStore.API.Models.Enums;

namespace GameStore.API.Repositories.Data.Configurations;

public class GameConfiguration : IEntityTypeConfiguration<Game>
{
    public void Configure(EntityTypeBuilder<Game> builder)
    {
        builder.ToTable("Games");
        builder.HasKey(g => g.Id);
        builder.Property(g => g.Id).UseIdentityColumn();
        builder.Property(g => g.Name).HasMaxLength(100).IsRequired();
        builder.Property(g => g.Slug).HasMaxLength(100).IsRequired();
        builder.HasIndex(g => g.Slug).IsUnique();
        builder.Property(g => g.IconUrl).HasMaxLength(500);
        builder.Property(g => g.IsActive).HasDefaultValue(true);
        builder.Property(g => g.DisplayOrder).HasDefaultValue(0);
        builder.Property(g => g.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        builder.Property(g => g.UpdatedAt).IsRequired();
    }
}

public class GameRankConfiguration : IEntityTypeConfiguration<GameRank>
{
    public void Configure(EntityTypeBuilder<GameRank> builder)
    {
        builder.ToTable("GameRanks");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).UseIdentityColumn();
        builder.Property(r => r.Name).HasMaxLength(100).IsRequired();
        builder.Property(r => r.IconUrl).HasMaxLength(500);
        builder.Property(r => r.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(r => r.Game)
            .WithMany(g => g.GameRanks)
            .HasForeignKey(r => r.GameId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class GameServerConfiguration : IEntityTypeConfiguration<GameServer>
{
    public void Configure(EntityTypeBuilder<GameServer> builder)
    {
        builder.ToTable("GameServers");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).UseIdentityColumn();
        builder.Property(s => s.Name).HasMaxLength(100).IsRequired();
        builder.Property(s => s.IsActive).HasDefaultValue(true);
        builder.Property(s => s.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(s => s.Game)
            .WithMany(g => g.GameServers)
            .HasForeignKey(s => s.GameId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class TagConfiguration : IEntityTypeConfiguration<Tag>
{
    public void Configure(EntityTypeBuilder<Tag> builder)
    {
        builder.ToTable("Tags");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).UseIdentityColumn();
        builder.Property(t => t.Name).HasMaxLength(100).IsRequired();
        builder.Property(t => t.Slug).HasMaxLength(100).IsRequired();
        builder.Property(t => t.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(t => t.Game)
            .WithMany(g => g.Tags)
            .HasForeignKey(t => t.GameId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class ProductListingConfiguration : IEntityTypeConfiguration<ProductListing>
{
    public void Configure(EntityTypeBuilder<ProductListing> builder)
    {
        builder.ToTable("ProductListings");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasDefaultValueSql("NEWID()");
        builder.Property(p => p.Title).HasMaxLength(200).IsRequired();
        builder.Property(p => p.Description).HasColumnType("NVARCHAR(MAX)");
        builder.Property(p => p.Price).HasColumnType("DECIMAL(18,0)").IsRequired();
        builder.Property(p => p.Status).HasConversion<byte>().HasDefaultValue(ProductStatus.Draft);
        builder.Property(p => p.ViewCount).HasDefaultValue(0);
        builder.Property(p => p.IsFeatured).HasDefaultValue(false);
        builder.Property(p => p.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        builder.Property(p => p.UpdatedAt).IsRequired();

        // Required indexes per RULE 06
        builder.HasIndex(p => new { p.Status, p.GameId, p.Price })
            .HasDatabaseName("IX_ProductListings_Status_GameId_Price");
        builder.HasIndex(p => p.CollaboratorId)
            .HasDatabaseName("IX_ProductListings_CollaboratorId");

        // Relationships
        builder.HasOne(p => p.Collaborator)
            .WithMany(u => u.ProductListings)
            .HasForeignKey(p => p.CollaboratorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.ApprovedBy)
            .WithMany()
            .HasForeignKey(p => p.ApprovedById)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(p => p.Game)
            .WithMany(g => g.ProductListings)
            .HasForeignKey(p => p.GameId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.GameRank)
            .WithMany(r => r.ProductListings)
            .HasForeignKey(p => p.GameRankId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.GameServer)
            .WithMany(s => s.ProductListings)
            .HasForeignKey(p => p.GameServerId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class ProductImageConfiguration : IEntityTypeConfiguration<ProductImage>
{
    public void Configure(EntityTypeBuilder<ProductImage> builder)
    {
        builder.ToTable("ProductImages");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasDefaultValueSql("NEWID()");
        builder.Property(i => i.ImageUrl).HasMaxLength(500).IsRequired();
        builder.Property(i => i.SortOrder).HasDefaultValue(0);
        builder.Property(i => i.IsMain).HasDefaultValue(false);
        builder.Property(i => i.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(i => i.Listing)
            .WithMany(p => p.Images)
            .HasForeignKey(i => i.ListingId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ProductListingTagConfiguration : IEntityTypeConfiguration<ProductListingTag>
{
    public void Configure(EntityTypeBuilder<ProductListingTag> builder)
    {
        builder.ToTable("ProductListingTags");
        builder.HasKey(pt => new { pt.ListingId, pt.TagId });

        builder.HasOne(pt => pt.Listing)
            .WithMany(p => p.ProductListingTags)
            .HasForeignKey(pt => pt.ListingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pt => pt.Tag)
            .WithMany(t => t.ProductListingTags)
            .HasForeignKey(pt => pt.TagId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ProductCategoryConfiguration : IEntityTypeConfiguration<ProductCategory>
{
    public void Configure(EntityTypeBuilder<ProductCategory> builder)
    {
        builder.ToTable("ProductCategories");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).UseIdentityColumn();
        builder.Property(c => c.Name).HasMaxLength(200).IsRequired();
        builder.Property(c => c.Slug).HasMaxLength(200);
        builder.Property(c => c.IsActive).HasDefaultValue(true);
        builder.Property(c => c.DisplayOrder).HasDefaultValue(0);
        builder.Property(c => c.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(c => c.Parent)
            .WithMany(c => c.Children)
            .HasForeignKey(c => c.ParentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

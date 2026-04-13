using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GameStore.API.Models.Entities;
using GameStore.API.Models.Enums;

namespace GameStore.API.Repositories.Data.Configurations;

public class WalletConfiguration : IEntityTypeConfiguration<Wallet>
{
    public void Configure(EntityTypeBuilder<Wallet> builder)
    {
        builder.ToTable("Wallets");
        builder.HasKey(w => w.Id);
        builder.Property(w => w.Id).HasDefaultValueSql("NEWID()");
        builder.HasIndex(w => w.UserId).IsUnique();
        builder.Property(w => w.Balance).HasColumnType("DECIMAL(18,0)").HasDefaultValue(0m);
        builder.Property(w => w.FrozenBalance).HasColumnType("DECIMAL(18,0)").HasDefaultValue(0m);
        builder.Property(w => w.Currency).HasMaxLength(10).HasDefaultValue("VND");
        builder.Property(w => w.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        builder.Property(w => w.UpdatedAt).IsRequired();
    }
}

public class WalletTransactionConfiguration : IEntityTypeConfiguration<WalletTransaction>
{
    public void Configure(EntityTypeBuilder<WalletTransaction> builder)
    {
        builder.ToTable("WalletTransactions");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasDefaultValueSql("NEWID()");
        builder.Property(t => t.Type).HasConversion<byte>().IsRequired();
        builder.Property(t => t.Amount).HasColumnType("DECIMAL(18,0)").IsRequired();
        builder.Property(t => t.BalanceAfter).HasColumnType("DECIMAL(18,0)").IsRequired();
        builder.Property(t => t.RefId).HasMaxLength(100);
        builder.Property(t => t.Note).HasMaxLength(500);
        builder.Property(t => t.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        // Required index per RULE 06
        builder.HasIndex(t => new { t.WalletId, t.CreatedAt })
            .IsDescending(false, true)
            .HasDatabaseName("IX_WalletTransactions_WalletId_CreatedAt");

        builder.HasOne(t => t.Wallet)
            .WithMany(w => w.Transactions)
            .HasForeignKey(t => t.WalletId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class PaymentRequestConfiguration : IEntityTypeConfiguration<PaymentRequest>
{
    public void Configure(EntityTypeBuilder<PaymentRequest> builder)
    {
        builder.ToTable("PaymentRequests");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasDefaultValueSql("NEWID()");
        builder.Property(p => p.Provider).HasMaxLength(50).IsRequired();
        builder.Property(p => p.Amount).HasColumnType("DECIMAL(18,0)").IsRequired();
        builder.Property(p => p.Status).HasMaxLength(20).IsRequired();
        builder.Property(p => p.ProviderRef).HasMaxLength(200);
        builder.Property(p => p.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        builder.Property(p => p.UpdatedAt).IsRequired();

        builder.HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class WithdrawRequestConfiguration : IEntityTypeConfiguration<WithdrawRequest>
{
    public void Configure(EntityTypeBuilder<WithdrawRequest> builder)
    {
        builder.ToTable("WithdrawRequests");
        builder.HasKey(w => w.Id);
        builder.Property(w => w.Id).HasDefaultValueSql("NEWID()");
        builder.Property(w => w.BankName).HasMaxLength(200).IsRequired();
        builder.Property(w => w.AccountNumber).HasMaxLength(30).IsRequired();
        builder.Property(w => w.AccountHolder).HasMaxLength(200).IsRequired();
        builder.Property(w => w.Amount).HasColumnType("DECIMAL(18,0)").IsRequired();
        builder.Property(w => w.Status).HasMaxLength(20).IsRequired();
        builder.Property(w => w.AdminNote).HasMaxLength(500);
        builder.Property(w => w.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        builder.Property(w => w.UpdatedAt).IsRequired();

        builder.HasOne(w => w.User)
            .WithMany()
            .HasForeignKey(w => w.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class CommissionRuleConfiguration : IEntityTypeConfiguration<CommissionRule>
{
    public void Configure(EntityTypeBuilder<CommissionRule> builder)
    {
        builder.ToTable("CommissionRules");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).UseIdentityColumn();
        builder.Property(c => c.AdminFeeRate).HasColumnType("DECIMAL(5,4)").IsRequired();
        builder.Property(c => c.EffectiveFrom).IsRequired();
        builder.Property(c => c.Priority).IsRequired();
        builder.Property(c => c.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(c => c.Game)
            .WithMany()
            .HasForeignKey(c => c.GameId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(c => c.Collaborator)
            .WithMany()
            .HasForeignKey(c => c.CollaboratorId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class CommissionLedgerConfiguration : IEntityTypeConfiguration<CommissionLedger>
{
    public void Configure(EntityTypeBuilder<CommissionLedger> builder)
    {
        builder.ToTable("CommissionLedgers");
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Id).HasDefaultValueSql("NEWID()");
        builder.Property(l => l.AdminFee).HasColumnType("DECIMAL(18,0)").IsRequired();
        builder.Property(l => l.CollaboratorEarning).HasColumnType("DECIMAL(18,0)").IsRequired();
        builder.Property(l => l.Rate).HasColumnType("DECIMAL(5,4)").IsRequired();
        builder.Property(l => l.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(l => l.Order)
            .WithMany()
            .HasForeignKey(l => l.OrderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(l => l.Collaborator)
            .WithMany()
            .HasForeignKey(l => l.CollaboratorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class InsuranceDepositConfiguration : IEntityTypeConfiguration<InsuranceDeposit>
{
    public void Configure(EntityTypeBuilder<InsuranceDeposit> builder)
    {
        builder.ToTable("InsuranceDeposits");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).HasDefaultValueSql("NEWID()");
        builder.Property(d => d.Amount).HasColumnType("DECIMAL(18,0)").IsRequired();
        builder.Property(d => d.Status).HasConversion<byte>().IsRequired();
        builder.Property(d => d.AdminNote).HasMaxLength(500);
        builder.Property(d => d.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(d => d.Collaborator)
            .WithMany(u => u.InsuranceDeposits)
            .HasForeignKey(d => d.CollaboratorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class CollaboratorContractConfiguration : IEntityTypeConfiguration<CollaboratorContract>
{
    public void Configure(EntityTypeBuilder<CollaboratorContract> builder)
    {
        builder.ToTable("CollaboratorContracts");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasDefaultValueSql("NEWID()");
        builder.Property(c => c.AdminFeeRate).HasColumnType("DECIMAL(5,4)").IsRequired();
        builder.Property(c => c.InsuranceAmount).HasColumnType("DECIMAL(18,0)").IsRequired();
        builder.Property(c => c.ContractStatus).HasConversion<byte>().IsRequired();
        builder.Property(c => c.StartDate).IsRequired();
        builder.Property(c => c.AdminNote).HasMaxLength(1000);
        builder.Property(c => c.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        builder.Property(c => c.UpdatedAt).IsRequired();

        builder.HasOne(c => c.Collaborator)
            .WithMany(u => u.CollaboratorContracts)
            .HasForeignKey(c => c.CollaboratorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

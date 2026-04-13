using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GameStore.API.Migrations
{
    /// <inheritdoc />
    public partial class AddProductCredentials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EncryptedPassword",
                table: "ProductListings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "EncryptedUsername",
                table: "ProductListings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EncryptedPassword",
                table: "ProductListings");

            migrationBuilder.DropColumn(
                name: "EncryptedUsername",
                table: "ProductListings");
        }
    }
}

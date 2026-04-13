using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GameStore.API.Migrations
{
    /// <inheritdoc />
    public partial class AddGameCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GameCategoryId",
                table: "ProductListings",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "GameCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GameId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CoverImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GameCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GameCategories_Games_GameId",
                        column: x => x.GameId,
                        principalTable: "Games",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductListings_GameCategoryId",
                table: "ProductListings",
                column: "GameCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_GameCategories_GameId",
                table: "GameCategories",
                column: "GameId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductListings_GameCategories_GameCategoryId",
                table: "ProductListings",
                column: "GameCategoryId",
                principalTable: "GameCategories",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductListings_GameCategories_GameCategoryId",
                table: "ProductListings");

            migrationBuilder.DropTable(
                name: "GameCategories");

            migrationBuilder.DropIndex(
                name: "IX_ProductListings_GameCategoryId",
                table: "ProductListings");

            migrationBuilder.DropColumn(
                name: "GameCategoryId",
                table: "ProductListings");
        }
    }
}

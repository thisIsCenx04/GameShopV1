# 🤖 GameStore VN — AI Agent Rules
> Bộ quy tắc bắt buộc cho AI Agent khi thực hiện bất kỳ tác vụ code, thiết kế, hoặc review nào trên dự án GameStore VN.
> Mọi output vi phạm các rule dưới đây phải được từ chối và làm lại.

---

## RULE 01 — NGÔN NGỮ & CÔNG NGHỆ BẮT BUỘC

AI Agent **chỉ được sử dụng** các công nghệ sau. Không tự ý thêm thư viện ngoài danh sách này nếu chưa có sự chấp thuận.

### Backend
| Hạng mục | Bắt buộc |
|---|---|
| Runtime | C# 12 / ASP.NET Core 8 Web API |
| ORM | Entity Framework Core 8 (Code-first) |
| Database | SQL Server 2022 |
| Cache / Lock | Redis 7 (StackExchange.Redis) |
| Real-time | ASP.NET SignalR |
| Background Jobs | Hangfire |
| Auth | JWT Bearer + BCrypt (cost=12) |
| Mapping | AutoMapper 13 |
| Validation | FluentValidation |
| Email | SendGrid hoặc MailKit (SMTP) |
| File Storage | Cloudinary |
| Logging | Serilog + Seq |
| API Docs | Swashbuckle (OpenAPI 3) |
| Testing | xUnit + Moq + TestContainers |
| Container | Docker + Docker Compose |

### Frontend
| Hạng mục | Bắt buộc |
|---|---|
| Framework | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS 3 + shadcn/ui |
| Server State | TanStack Query v5 |
| Client State | Zustand |
| Form | React Hook Form + Zod |
| Real-time | @microsoft/signalr |

### ❌ Nghiêm cấm
- Không dùng MediatR, CQRS, Event Sourcing, hay bất kỳ pattern kiến trúc phức tạp nào không có trong tài liệu.
- Không dùng Dapper thay EF Core.
- Không dùng MassTransit / RabbitMQ (dành cho v2.0).
- Không dùng Elasticsearch (dành cho v2.0).

---

## RULE 02 — CẤU TRÚC PROJECT BACKEND (BẮT BUỘC TUYỆT ĐỐI)

Toàn bộ backend nằm trong **1 solution, 1 project chính** (`GameStore.API`). Không tách thành nhiều class library project riêng lẻ.

```
GameStore.sln
├── GameStore.API/               ← Project duy nhất
│   ├── Controllers/             ← Tầng điều hướng
│   ├── DTOs/                    ← Request / Response schema
│   ├── Mappings/                ← AutoMapper profiles
│   ├── Models/                  ← Entities, Enums, Constants
│   │   ├── Entities/
│   │   ├── Enums/
│   │   └── Constants/
│   ├── Repositories/            ← Tầng giao tiếp DB
│   │   ├── Interfaces/
│   │   ├── Data/                ← AppDbContext, Configurations, Migrations
│   │   └── *.cs                 ← Repository implementations
│   ├── Services/                ← Tầng xử lý business logic
│   │   ├── Interfaces/
│   │   └── *.cs                 ← Service implementations
│   ├── Validators/              ← FluentValidation rules
│   ├── Formatters/              ← ApiResponseFormatter, PaginationFormatter, ErrorResponseFormatter
│   ├── Hubs/                    ← SignalR Hubs
│   ├── Middlewares/             ← Exception, Logging, RateLimit
│   ├── Extensions/              ← DI registration helpers
│   ├── appsettings.json
│   ├── GameStore.API.http       ← REST Client test file
│   └── Program.cs
└── GameStore.Tests/             ← Project test riêng (tham chiếu GameStore.API)
    ├── Unit/
    └── Integration/
```

### ❌ Nghiêm cấm
- Không tạo `GameStore.Services.csproj`, `GameStore.Repositories.csproj`, `GameStore.Domain.csproj` tách biệt.
- Không đặt business logic vào project test hoặc project phụ nào khác.

---

## RULE 03 — NGUYÊN TẮC PHÂN TẦNG CONTROLLER → SERVICE → REPOSITORY

AI Agent phải tuân thủ **nghiêm ngặt** trách nhiệm từng tầng. Vi phạm tầng là lỗi nghiêm trọng.

### Controller — Chỉ điều hướng
```csharp
// ✅ ĐÚNG
[HttpPost]
public async Task<IActionResult> PlaceOrder([FromBody] PlaceOrderRequest request)
{
    var result = await _orderService.PlaceOrderAsync(GetUserId(), request);
    return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse.Success(result));
}

// ❌ SAI — Controller không được chứa business logic
[HttpPost]
public async Task<IActionResult> PlaceOrder([FromBody] PlaceOrderRequest request)
{
    var listing = await _dbContext.ProductListings.FindAsync(request.ListingId); // SAI
    if (listing.Status != ProductStatus.Active) return BadRequest("..."); // SAI
}
```

**Controller được phép:**
- Nhận HTTP request, đọc route params / query string / body
- Gọi đúng 1 Service method tương ứng
- Trả về HTTP response với status code đúng (200/201/400/401/403/404/409/422/500)
- Wrap response vào `ApiResponse<T>` qua Formatter

**Controller không được phép:**
- Query database trực tiếp (dù qua DbContext hay Repository)
- Chứa bất kỳ if/else business rule nào
- Gọi nhiều hơn 1 Service (nếu cần orchestrate → viết thêm method trong Service)
- Biết về domain model — chỉ làm việc với DTO

---

### Service — Toàn bộ business logic
```csharp
// ✅ ĐÚNG
public async Task<OrderResponse> PlaceOrderAsync(Guid buyerId, PlaceOrderRequest request)
{
    // 1. Validate business rule
    var listing = await _productRepo.GetByIdAsync(request.ListingId);
    if (listing is null || listing.Status != ProductStatus.Active)
        throw new BusinessException("Sản phẩm không tồn tại hoặc đã bán.");

    // 2. Distributed lock tránh mua trùng
    await using var redisLock = await _cache.AcquireLockAsync($"product:lock:{listing.Id}");
    if (redisLock is null) throw new BusinessException("Sản phẩm đang được xử lý.");

    // 3. Orchestrate: trừ ví, tạo order, ghi ledger
    await _walletService.DeductAsync(buyerId, listing.Price);
    var order = await _orderRepo.CreateAsync(...);
    await _notificationService.NotifyAsync(...);

    return _mapper.Map<OrderResponse>(order);
}
```

**Service được phép:**
- Toàn bộ business rule và điều kiện
- Gọi nhiều Repository khác nhau
- Gọi external services (Redis, Cloudinary, email)
- Tính toán hoa hồng, chia ví, escrow
- Phát thông báo SignalR

**Service không được phép:**
- Trả về `IActionResult` hay `HttpStatusCode`
- Biết về HTTP context (`HttpContext`, `Request`, `Response`)
- Inject `DbContext` trực tiếp — phải qua Repository interface

---

### Repository — Chỉ giao tiếp DB
```csharp
// ✅ ĐÚNG
public async Task<ProductListing?> GetByIdWithDetailsAsync(Guid id)
    => await _ctx.ProductListings
        .Include(p => p.Game)
        .Include(p => p.Images)
        .FirstOrDefaultAsync(p => p.Id == id && p.Status == ProductStatus.Active);

// ❌ SAI — Repository không được chứa business logic
public async Task<ProductListing?> GetByIdAsync(Guid id)
{
    var listing = await _ctx.ProductListings.FindAsync(id);
    if (listing.Price > 1_000_000) listing.IsFeatured = true; // SAI — đây là business logic
    return listing;
}
```

**Repository được phép:**
- CRUD cơ bản và query EF Core có tham số
- Trả về Entity hoặc DTO đơn giản
- Dùng Include, Where, OrderBy, Skip/Take

**Repository không được phép:**
- Chứa business rule
- Gọi sang Repository khác (dùng Service làm orchestrator)
- Gọi external service (email, Redis, SignalR)

---

## RULE 04 — CHUẨN DTO & RESPONSE

### Mọi API response phải wrap vào `ApiResponse<T>`
```csharp
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public List<string> Errors { get; set; } = new();
    public PaginationMeta? Meta { get; set; }
}
```

### HTTP Status Code chuẩn — không dùng tùy tiện
| Tình huống | Status |
|---|---|
| GET thành công | 200 OK |
| POST tạo mới | 201 Created |
| Input không hợp lệ (format) | 400 Bad Request |
| Chưa xác thực | 401 Unauthorized |
| Không có quyền | 403 Forbidden |
| Không tìm thấy | 404 Not Found |
| Xung đột (email trùng…) | 409 Conflict |
| Vi phạm business rule | 422 Unprocessable |
| Lỗi server | 500 Internal Server Error |

### DTO không được chứa logic
- DTO chỉ là POCO — có property, không có method xử lý
- Mọi validation viết trong `Validators/` bằng FluentValidation, không dùng DataAnnotation
- Mapping Entity ↔ DTO chỉ được thực hiện trong `Mappings/` (AutoMapper Profile), không map thủ công trong Controller hay Service

---

## RULE 05 — PHÂN QUYỀN & BẢO MẬT

### 4 Role duy nhất — không được thêm role mới
```
Guest → Customer → Collaborator → Admin
```

### Quy tắc cấp quyền Collaborator (BẮT BUỘC)
- **Không có luồng tự đăng ký Collaborator** — mọi tự động hóa kiểu này đều sai.
- Người dùng liên hệ Admin ngoài hệ thống → thỏa thuận hoa hồng + phí bảo hiểm → Admin nâng role trong hệ thống.
- API nâng role chỉ được gọi bởi `Admin` role, không có exception nào.
- Phí bảo hiểm phải được ghi vào bảng `InsuranceDeposits` với status `Held`.
- Hợp đồng phải được ghi vào bảng `CollaboratorContracts`.

### Bảo mật bắt buộc
- Mật khẩu: BCrypt hash, cost factor = 12. Tuyệt đối không lưu plaintext, MD5, SHA1.
- JWT: Access Token TTL = 15 phút, Refresh Token TTL = 7 ngày, rotation mỗi lần refresh.
- Thông tin tài khoản game giao cho buyer: mã hóa AES-256-GCM trước khi lưu vào `AccountDeliveries`.
- Description sản phẩm (HTML): phải qua HtmlSanitizer trước khi lưu DB.
- SQL: chỉ dùng EF Core parameterized query, không viết raw SQL có string interpolation với input người dùng.
- CORS: chỉ allow domain frontend đã cấu hình trong `appsettings.json`.
- Rate Limit: 100 req/phút với anonymous, 500 req/phút với authenticated.

### Attribute phân quyền trên Controller
```csharp
// Phải khai báo tường minh — không để endpoint public không có lý do
[Authorize(Roles = "Admin")]
[Authorize(Roles = "Collaborator")]
[Authorize(Roles = "Customer,Collaborator")]
[AllowAnonymous] // Chỉ dùng cho: đăng ký, đăng nhập, xem sản phẩm public
```

---

## RULE 06 — DATABASE & EF CORE

### Naming convention bảng
- Tên bảng: PascalCase số nhiều (`ProductListings`, `OrderStatusLogs`, không phải `product_listing`)
- Khóa chính: `Id` kiểu `UNIQUEIDENTIFIER` (UUID) — trừ bảng lookup dùng `INT IDENTITY`
- FK column: `{Entity}Id` (ví dụ: `CollaboratorId`, `BuyerId`, `GameId`)
- Timestamp: `CreatedAt` kiểu `DATETIME2 NOT NULL DEFAULT GETUTCDATE()`, `UpdatedAt DATETIME2 NOT NULL`
- Soft fields: `IsActive BIT NOT NULL DEFAULT 1`

### Migration
- Mọi thay đổi schema phải qua EF Core migration — không viết SQL script tay.
- Migration phải có tên mô tả rõ ràng: `AddCollaboratorContractsTable`, `AddInsuranceFeeStatus`
- Migration phải được commit vào git cùng với code thay đổi.

### Index bắt buộc (đã thiết kế — không được bỏ)
```sql
-- ProductListings
CREATE INDEX IX_ProductListings_Status_GameId_Price ON ProductListings(Status, GameId, Price)
CREATE INDEX IX_ProductListings_CollaboratorId ON ProductListings(CollaboratorId)
CREATE FULLTEXT INDEX ON ProductListings(Title, Description)

-- Orders
CREATE INDEX IX_Orders_BuyerId_Status ON Orders(BuyerId, Status)
CREATE INDEX IX_Orders_ListingId ON Orders(ListingId)

-- WalletTransactions
CREATE INDEX IX_WalletTransactions_WalletId_CreatedAt ON WalletTransactions(WalletId, CreatedAt DESC)

-- Notifications
CREATE INDEX IX_Notifications_UserId_IsRead_CreatedAt ON Notifications(UserId, IsRead, CreatedAt DESC)

-- RefreshTokens
CREATE UNIQUE INDEX UIX_RefreshTokens_Token ON RefreshTokens(Token)
```

---

## RULE 07 — REDIS & CACHING

### Cache key chuẩn — không được tự đặt tên tùy tiện
| Key Pattern | TTL | Xóa khi nào |
|---|---|---|
| `product:{id}` | 5 phút | update / approve / sell |
| `products:search:{hash}` | 2 phút | bất kỳ listing thay đổi |
| `games:all` | 1 giờ | Admin thêm/sửa game |
| `collaborator:stats:{id}` | 15 phút | Background job cập nhật |
| `wallet:balance:{userId}` | 30 giây | Sau mỗi transaction ví |
| `session:{jti}` | Theo JWT exp | Logout / revoke |
| `product:lock:{listingId}` | 5 phút | Distributed lock mua hàng |

### Distributed Lock — bắt buộc khi mua hàng
- Phải acquire Redis lock trên `product:lock:{listingId}` trước khi xử lý order.
- TTL lock = 5 phút.
- Nếu không acquire được → trả lỗi 409 "Sản phẩm đang được xử lý, vui lòng thử lại."
- Phải dùng `await using` hoặc try/finally để đảm bảo lock được release.

---

## RULE 08 — QUY TRÌNH GIAO DỊCH & TÀI CHÍNH

### Luồng mua hàng — thứ tự bắt buộc
```
1. Kiểm tra listing.Status == Active
2. Acquire Redis distributed lock (TTL 5 phút)
3. Freeze số tiền trong Wallet buyer (chuyển Balance → FrozenBalance)
4. Tạo Order với status = Pending
5. Xử lý thanh toán (ví nội bộ / MoMo / VNPay)
6. Cập nhật Order.Status = Paid
7. Cập nhật ProductListing.Status = Sold
8. Giao thông tin tài khoản (AES-256-GCM) qua email + in-app
9. Sau 24h (hoặc buyer confirm) → Order.Status = Completed
10. Chia tiền: CollaboratorEarning vào ví Collaborator, AdminFee vào ví Admin
11. Ghi CommissionLedger
12. Release Redis lock
```

**Bất kỳ bước nào thất bại → rollback toàn bộ (database transaction).**

### Chia hoa hồng — priority rule
```
Priority 1: Rule theo Collaborator cụ thể (Priority = 1)
Priority 2: Rule theo Game cụ thể (Priority = 5)
Priority 3: Rule mặc định toàn hệ thống (Priority = 10)
```
- Luôn lấy rule có Priority số nhỏ nhất và còn hiệu lực (`EffectiveFrom <= now <= EffectiveTo hoặc EffectiveTo IS NULL`).
- Snapshot tỷ lệ hoa hồng tại thời điểm tạo Order vào `Orders.AdminFee` và `Orders.CollaboratorEarning` — không tính lại sau.

### Phí bảo hiểm Collaborator
- Khi Admin cấp role → tạo bản ghi `InsuranceDeposits` với status = `Held` và `CollaboratorContracts` với status = `Active`.
- Khi Collaborator gian lận (Admin xử lý dispute) → cập nhật `InsuranceDeposits.Status = Forfeited`, dùng số tiền bồi thường cho buyer.
- Khi Collaborator kết thúc hợp đồng hợp lệ → `InsuranceDeposits.Status = Refunded`, hoàn tiền về ví Collaborator, `CollaboratorContracts.Status = Terminated`.

---

## RULE 09 — VALIDATOR (FLUENTVALIDATION)

Mọi Request DTO vào Service phải có Validator tương ứng trong `Validators/`. Không dùng `[Required]`, `[MaxLength]` DataAnnotation.

### Validator bắt buộc tối thiểu

**Auth:**
```csharp
// RegisterRequestValidator
RuleFor(x => x.Email).NotEmpty().EmailAddress();
RuleFor(x => x.Password).NotEmpty().MinimumLength(8)
    .Matches("[A-Z]").Matches("[0-9]");
```

**Products:**
```csharp
// CreateListingRequestValidator
RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
RuleFor(x => x.Price).GreaterThan(0);
RuleFor(x => x.Images).Must(imgs => imgs.Count <= 10)
    .WithMessage("Tối đa 10 ảnh.");
RuleFor(x => x.GameId).NotEmpty();
RuleFor(x => x.GameRankId).NotEmpty();
```

**Wallet:**
```csharp
// WithdrawRequestValidator
RuleFor(x => x.Amount).GreaterThanOrEqualTo(100_000)
    .WithMessage("Số tiền rút tối thiểu 100,000 VND.");
RuleFor(x => x.BankAccountNumber).NotEmpty().Matches(@"^\d{6,20}$");
```

---

## RULE 10 — FORMATTER & CHUẨN HÓA RESPONSE

### ApiResponseFormatter — mọi response đều phải qua đây
```csharp
// ✅ ĐÚNG — dùng Formatter
return Ok(ApiResponse.Success(result));
return CreatedAtAction(..., ApiResponse.Success(result));
return NotFound(ApiResponse.Fail("Sản phẩm không tồn tại."));

// ❌ SAI — trả thẳng object không wrap
return Ok(result);
return Ok(new { id = result.Id, name = result.Title });
```

### ErrorResponseFormatter — lỗi validation phải chuẩn hóa
```json
{
  "success": false,
  "data": null,
  "message": "Dữ liệu không hợp lệ.",
  "errors": [
    "Tiêu đề không được để trống.",
    "Giá bán phải lớn hơn 0."
  ]
}
```

### PaginationFormatter — danh sách có phân trang phải có meta
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 143,
    "totalPages": 8
  }
}
```

---

## RULE 11 — BACKGROUND JOBS (HANGFIRE)

AI Agent khi implement job phải đảm bảo các job sau tồn tại và chạy đúng lịch:

| Job | Lịch | Mục đích |
|---|---|---|
| `ExpiredOrderCanceller` | Mỗi 1 phút | Hủy Order quá hạn thanh toán (>5 phút), hoàn FrozenBalance |
| `AutoCompleteOrders` | Mỗi 1 giờ | Tự hoàn tất Order đã giao >24h chưa confirm |
| `CollaboratorStatsUpdater` | Mỗi 6 giờ | Cập nhật `CollaboratorStats` (AvgRating, DisputeRate, ReputationScore) |
| `WalletReconciliation` | Hàng ngày 02:00 | Đối soát số dư ví, phát hiện sai lệch |

---

## RULE 12 — LOGGING & OBSERVABILITY

- Sử dụng **Serilog** structured logging — không dùng `Console.WriteLine` hay `Debug.WriteLine`.
- Mọi exception phải được bắt tại `ExceptionHandlingMiddleware` — không try/catch im lặng trong Service.
- Log level mặc định: `Warning` trở lên cho Production; `Information` cho Development.
- Mọi request phải có `CorrelationId` trong header và log.
- Lỗi payment webhook phải log đầy đủ raw payload để audit.

```csharp
// ✅ ĐÚNG
_logger.LogWarning("Order {OrderId} expired without payment. Releasing lock.", orderId);
_logger.LogError(ex, "Failed to process MoMo webhook for ref {ProviderRef}", providerRef);

// ❌ SAI
Console.WriteLine("Error: " + ex.Message);
// hoặc catch và bỏ qua exception
```

---

## RULE 13 — NAMING CONVENTION

### Backend (C#)
| Loại | Convention | Ví dụ |
|---|---|---|
| Class, Interface | PascalCase | `ProductService`, `IOrderRepository` |
| Method | PascalCase | `GetByIdAsync`, `PlaceOrderAsync` |
| Private field | camelCase với `_` | `_productRepo`, `_cache` |
| Constant | UPPER_SNAKE_CASE | `MAX_IMAGE_COUNT` |
| DTO suffix | Request / Response | `CreateListingRequest`, `OrderResponse` |
| Async method | suffix `Async` | `GetByIdAsync`, không phải `GetById` |
| Interface | prefix `I` | `IProductService`, không phải `ProductServiceInterface` |

### Database
| Loại | Convention | Ví dụ |
|---|---|---|
| Bảng | PascalCase số nhiều | `ProductListings`, `OrderStatusLogs` |
| Cột | PascalCase | `CreatedAt`, `AdminFeeRate` |
| FK | `{Entity}Id` | `CollaboratorId`, `BuyerId` |
| Index | `IX_{Table}_{Columns}` | `IX_Orders_BuyerId_Status` |
| Unique Index | `UIX_{Table}_{Column}` | `UIX_RefreshTokens_Token` |

### Frontend (TypeScript)
| Loại | Convention | Ví dụ |
|---|---|---|
| Component | PascalCase | `ProductCard`, `OrderDetail` |
| Hook | camelCase prefix `use` | `useAuth`, `useProductSearch` |
| Type / Interface | PascalCase | `ProductResponse`, `OrderStatus` |
| File | kebab-case | `product-card.tsx`, `use-auth.ts` |

---

## RULE 14 — TESTING

### Unit Test — bắt buộc cho mọi Service method
```csharp
// Cấu trúc bắt buộc: Arrange → Act → Assert
[Fact]
public async Task PlaceOrderAsync_WhenListingNotActive_ThrowsBusinessException()
{
    // Arrange
    var mockRepo = new Mock<IProductRepository>();
    mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
        .ReturnsAsync(new ProductListing { Status = ProductStatus.Sold });
    var service = new OrderService(mockRepo.Object, ...);

    // Act & Assert
    await Assert.ThrowsAsync<BusinessException>(
        () => service.PlaceOrderAsync(Guid.NewGuid(), new PlaceOrderRequest()));
}
```

### Integration Test — bắt buộc cho luồng quan trọng
- Luồng mua hàng end-to-end (từ HTTP POST đến DB)
- Luồng đăng ký + đăng nhập + refresh token
- Luồng dispute + refund

### Coverage tối thiểu
- Service layer: ≥ 80% line coverage
- Repository layer: ≥ 60% (test với InMemory DbContext hoặc TestContainers)

---

## RULE 15 — ĐIỀU CẤM TUYỆT ĐỐI

Bất kỳ output nào vi phạm các điều sau đây phải bị từ chối hoàn toàn:

| # | Hành vi bị cấm |
|---|---|
| 1 | Inject `DbContext` trực tiếp vào Controller hoặc Service |
| 2 | Viết business logic trong Controller |
| 3 | Gọi Repository từ Repository khác |
| 4 | Trả `IActionResult` từ Service |
| 5 | Tạo thêm project class library ngoài `GameStore.API` và `GameStore.Tests` |
| 6 | Cho phép Customer tự đăng ký thành Collaborator (phải qua Admin) |
| 7 | Lưu mật khẩu không qua BCrypt, hoặc lưu plaintext |
| 8 | Lưu thông tin tài khoản game không qua AES-256-GCM |
| 9 | Bỏ qua distributed Redis lock trong flow mua hàng |
| 10 | Chia hoa hồng không theo `CommissionRules` priority |
| 11 | Trả API response không wrap vào `ApiResponse<T>` |
| 12 | Viết migration bằng raw SQL thay vì EF Core |
| 13 | Dùng `Console.WriteLine` thay Serilog |
| 14 | Thêm thư viện không có trong danh sách RULE 01 |
| 15 | Bỏ qua phí bảo hiểm khi cấp role Collaborator |

---

## CHECKLIST TRƯỚC KHI SUBMIT CODE

Trước khi đưa ra bất kỳ đoạn code nào, AI Agent phải tự kiểm tra:

- [ ] Code nằm đúng thư mục theo cấu trúc RULE 02?
- [ ] Controller không chứa business logic, chỉ gọi Service?
- [ ] Service không inject DbContext trực tiếp, không trả IActionResult?
- [ ] Repository không chứa business rule?
- [ ] DTO có Validator tương ứng trong `Validators/`?
- [ ] Response được wrap bởi `ApiResponseFormatter`?
- [ ] Method async có suffix `Async`?
- [ ] Migration được tạo bằng EF Core CLI, không viết raw SQL?
- [ ] Mật khẩu qua BCrypt, thông tin game qua AES-256-GCM?
- [ ] Cache key theo đúng pattern trong RULE 07?
- [ ] Distributed lock Redis có trong flow mua hàng?
- [ ] Unit test có cho Service method mới?
- [ ] Logging dùng Serilog, không dùng Console.WriteLine?

---

*GameStore VN — AI Agent Rules v1.0 | Cập nhật theo tài liệu thiết kế v1.3 | Tháng 4/2026*

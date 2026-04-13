// ============ Auth ============
export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { email: string; password: string; fullName: string; }
export interface TokenResponse { accessToken: string; refreshToken: string; expiresAt: string; tokenType: string; }

// ============ User ============
export interface UserProfile {
  id: string; email: string; role: string;
  fullName?: string; avatarUrl?: string; phoneNumber?: string;
  isActive: boolean; emailConfirmed: boolean; createdAt: string;
}

// ============ Game ============
export interface Game { id: number; name: string; slug: string; iconUrl?: string; coverImageUrl?: string; displayOrder: number; }
export interface GameRank { id: number; name: string; iconUrl?: string; order: number; }
export interface GameServer { id: number; name: string; }
export interface GameCategory {
  id: number; gameId: number; name: string; slug: string;
  coverImageUrl?: string; description?: string; isActive: boolean; displayOrder: number;
  productCount?: number; soldCount?: number;
}
export interface GameDetail extends Game { ranks: GameRank[]; servers: GameServer[]; categories: GameCategory[]; }

// ============ Product ============
export interface ProductListItem {
  id: string; title: string; price: number; status: string;
  mainImageUrl?: string; gameName: string; gameRankName: string;
  gameServerName?: string; gameCategoryName?: string; viewCount: number; isFeatured: boolean;
  collaboratorName: string; createdAt: string;
}
export interface ProductImage { id: string; imageUrl: string; sortOrder: number; isMain: boolean; }
export interface Tag { id: number; name: string; slug: string; }
export interface ProductDetail {
  id: string; collaboratorId: string; collaboratorName: string;
  gameId: number; gameName: string; gameRankId: number; gameRankName: string;
  gameServerId?: number; gameServerName?: string;
  gameCategoryId?: number; gameCategoryName?: string;
  title: string; description?: string; price: number; status: string;
  viewCount: number; isFeatured: boolean;
  approvedAt?: string; createdAt: string; updatedAt: string;
  images: ProductImage[]; tags: Tag[];
}
export interface ProductFilter {
  gameId?: number; gameRankId?: number; gameServerId?: number;
  minPrice?: number; maxPrice?: number; search?: string;
  tagIds?: number[]; categoryId?: number; sortBy?: string; page?: number; pageSize?: number;
}

// ============ Order ============
export interface OrderListItem {
  id: string; orderCode: string; amount: number; status: string;
  productTitle: string; gameName?: string; buyerName?: string; createdAt: string;
}
export interface OrderDetail extends OrderListItem {
  productId: string; buyerId: string; collaboratorId: string;
  collaboratorName?: string; collaboratorEarning: number; adminFee: number;
  paymentMethod?: string; completedAt?: string;
  accountDelivery?: { username: string; password: string; notes?: string };
  statusLogs: { oldStatus: string; newStatus: string; changedAt: string; note?: string }[];
}

// ============ Wallet ============
export interface WalletInfo { id: string; balance: number; frozenBalance: number; availableBalance: number; }
export interface WalletTransaction {
  id: string; type: string; amount: number; balanceAfter: number;
  description?: string; note?: string; refId?: string; createdAt: string;
}

// ============ Notification ============
export interface NotificationItem {
  id: string; type: string; title: string; body: string;
  isRead: boolean; createdAt: string;
}

// ============ Withdraw ============
export interface WithdrawResponse {
  id: string; amount: number; bankName: string; accountNumber: string;
  accountHolder: string; status: string; adminNote?: string;
  processedAt?: string; createdAt: string;
}

// ============ Dispute ============
export interface DisputeResponse {
  id: string; orderId: string; orderCode: string; reporterId: string;
  reporterName: string; reason: string; status: string;
  resolution?: string; adminNote?: string;
  createdAt: string; updatedAt: string; attachmentUrls: string[];
}

// ============ API Response ============
export interface ApiResponse<T> {
  success: boolean; data: T; message?: string;
  errors: string[]; meta?: PaginationMeta;
}
export interface PaginationMeta {
  page: number; pageSize: number; totalItems: number; totalPages: number;
}

// ============ Admin User Management ============
export interface AdminUserDetail {
  id: string; email: string; role: string;
  fullName?: string; avatarUrl?: string; phoneNumber?: string;
  isActive: boolean; emailConfirmed: boolean; createdAt: string;
  // Wallet
  walletBalance: number; walletFrozenBalance: number; walletAvailableBalance: number;
  // Collaborator
  adminFeeRate?: number; insuranceAmount?: number; contractStatus?: string;
  // Bank
  bankName?: string; bankAccountNumber?: string; bankAccountName?: string;
  // Stats
  totalSold?: number; avgRating?: number; badgeLevel?: string;
}


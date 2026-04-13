'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Gamepad2, Package } from 'lucide-react';
import type { GameDetail, GameCategory, ApiResponse } from '@/types';

export default function GameCategoriesPage() {
  const params = useParams();
  const gameId = params.gameId as string;

  const { data: game, isLoading: isGameLoading } = useQuery({
    queryKey: ['game', gameId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<GameDetail>>(`/games/${gameId}`);
      return data.data;
    },
    enabled: !!gameId,
  });

  const { data: categories = [], isLoading: isCatLoading } = useQuery({
    queryKey: ['game-categories', gameId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<GameCategory[]>>(`/games/${gameId}/categories`);
      return data.data;
    },
    enabled: !!gameId,
  });

  if (isGameLoading) return <div className="p-12 text-center text-muted-foreground">Đang tải...</div>;
  if (!game) return <div className="p-12 text-center text-muted-foreground">Không tìm thấy game.</div>;

  return (
    <div className="container mx-auto px-4 py-8 flex-1">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{game.name}</span>
      </div>

      <div className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground inline-flex items-center gap-3 uppercase">
          {game.iconUrl ? (
            <img src={game.iconUrl} alt={game.name} className="h-10 w-10 md:h-12 md:w-12 rounded object-cover" />
          ) : (
            <Gamepad2 className="h-10 w-10 text-primary" />
          )}
          KHO ACC {game.name}
        </h1>
        <div className="h-1 w-24 bg-primary mt-4 rounded-full"></div>
      </div>

      {isCatLoading ? (
        <div className="text-center py-12 text-muted-foreground">Đang tải danh mục...</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border/50">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Game này chưa có danh mục nào.</p>
          <Link href={`/products?gameId=${gameId}`}>
            <Button variant="outline" className="mt-4 border-primary/50 text-primary hover:bg-primary/10">
              Xem tất cả sản phẩm
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Card key={cat.id} className="bg-card border-border/50 hover:border-primary/50 hover:shadow-[0_0_20px_oklch(0.75_0.18_190/0.15)] transition-all overflow-hidden group flex flex-col">
              <div className="aspect-[4/3] relative bg-secondary overflow-hidden">
                {cat.coverImageUrl ? (
                  <img src={cat.coverImageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-accent/10">
                    <Gamepad2 className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent"></div>
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-heading text-lg font-bold text-white uppercase text-center drop-shadow-md line-clamp-2">
                    {cat.name}
                  </h3>
                </div>
              </div>
              <CardContent className="p-4 flex flex-col flex-1 gap-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Số tài khoản:</span>
                  <span className="font-semibold text-foreground">{cat.productCount || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Đã bán:</span>
                  <span className="font-semibold text-success">{cat.soldCount || 0}</span>
                </div>
                <Link href={`/products?gameId=${gameId}&categoryId=${cat.id}`} className="mt-auto block mt-2">
                  <Button className="w-full bg-primary text-primary-foreground font-heading hover:px-2 transition-all">
                    Xem tất cả
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

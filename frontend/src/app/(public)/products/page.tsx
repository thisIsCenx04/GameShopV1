'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/shared/product-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ApiResponse, ProductListItem, Game, GameCategory } from '@/types';

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialGameId = searchParams.get('gameId') || '';
  const initialCategoryId = searchParams.get('categoryId') || '';

  const [search, setSearch] = useState('');
  const [gameId, setGameId] = useState(initialGameId);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: async () => { const { data } = await api.get<ApiResponse<Game[]>>('/games'); return data.data; },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['game-categories', gameId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<GameCategory[]>>(`/games/${gameId}/categories`);
      return data.data;
    },
    enabled: !!gameId,
  });

  const queryStr = [`pageSize=20`, `sortBy=${sortBy}`, search && `search=${search}`, gameId && `gameId=${gameId}`, categoryId && `categoryId=${categoryId}`].filter(Boolean).join('&');

  const { data: result } = useQuery({
    queryKey: ['products', queryStr],
    queryFn: async () => { const { data } = await api.get<ApiResponse<ProductListItem[]>>(`/products?${queryStr}`); return data; },
  });

  const products = result?.data || [];

  return (
    <div className="container mx-auto px-4 py-8 flex-1">
      <h1 className="font-heading text-3xl font-bold mb-6 text-foreground">Cửa hàng</h1>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tài khoản..."
            className="pl-10 bg-card border-border/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="border-border/50 md:hidden" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal className="h-4 w-4 mr-2" /> Bộ lọc
        </Button>
        <div className={`flex flex-col md:flex-row gap-3 ${showFilters ? 'flex' : 'hidden md:flex'}`}>
          <Select value={gameId} onValueChange={(v: string | null) => setGameId(v || '')}>
            <SelectTrigger className="w-full md:w-[160px] bg-card border-border/50">
              <SelectValue placeholder="Game" />
            </SelectTrigger>
            <SelectContent>
              {games.map((g) => (
                <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {gameId && categories.length > 0 && (
            <Select value={categoryId} onValueChange={(v: string | null) => setCategoryId(v || '')}>
              <SelectTrigger className="w-full md:w-[160px] bg-card border-border/50">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Tất cả danh mục</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={sortBy} onValueChange={(v: string | null) => setSortBy(v || 'newest')}>
            <SelectTrigger className="w-full md:w-[140px] bg-card border-border/50">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="price-asc">Giá tăng dần</SelectItem>
              <SelectItem value="price-desc">Giá giảm dần</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Badge variant="secondary" className="text-xs">
          {gameId ? games.find(g => g.id.toString() === gameId)?.name : 'Tất cả game'}
        </Badge>
        {categoryId && (
           <Badge variant="secondary" className="text-xs">
             {categories.find(c => c.id.toString() === categoryId)?.name || 'Danh mục'}
           </Badge>
        )}
        <Badge variant="outline" className="text-xs border-primary/30 text-primary">{products.length} kết quả</Badge>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        {products.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground text-sm">Không tìm thấy sản phẩm nào.</div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-12 text-center">Đang tải...</div>}>
      <ProductsContent />
    </Suspense>
  );
}

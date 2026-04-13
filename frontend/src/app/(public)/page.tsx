'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/shared/product-card';
import BannerCarousel from '@/components/shared/banner-carousel';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Zap, Users } from 'lucide-react';
import type { Game, ProductListItem, ApiResponse } from '@/types';

export default function HomePage() {
  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: async () => { const { data } = await api.get<ApiResponse<Game[]>>('/games'); return data.data; },
  });

  const { data: products = [] } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => { const { data } = await api.get<ApiResponse<ProductListItem[]>>('/products?pageSize=8'); return data.data; },
  });

  return (
    <>
      {/* Banner Carousel */}
      <BannerCarousel />

      {/* Game Categories */}
      <section className="container mx-auto px-4 py-10">
        <h2 className="font-heading text-2xl font-bold mb-6 text-foreground">Danh mục game</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {games.map((g) => (
            <Link
              key={g.id}
              href={`/games/${g.id}`}
              className="flex flex-col items-center p-5 rounded-xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-[0_0_20px_oklch(0.75_0.18_190/0.15)] transition-all group"
            >
              {g.iconUrl ? (
                <img src={g.iconUrl} alt={g.name} className="h-14 w-14 rounded-lg object-cover mb-3" />
              ) : (
                <span className="text-4xl mb-3">🎮</span>
              )}
              <span className="font-heading text-sm font-semibold text-foreground group-hover:text-primary transition-colors text-center">{g.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products — 4 column grid per reference */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold text-foreground">Sản phẩm nổi bật</h2>
          <Link href="/products">
            <Button variant="ghost" className="text-primary hover:text-primary/80 font-heading">
              Xem tất cả <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
          {products.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground text-sm">Chưa có sản phẩm nào.</div>
          )}
        </div>
      </section>

      {/* Features — before footer */}
      <section className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: 'An toàn tuyệt đối', desc: 'Giao dịch được bảo vệ bởi hệ thống escrow, hoàn tiền nếu có vấn đề.' },
            { icon: Zap, title: 'Giao hàng tức thì', desc: 'Thông tin tài khoản được giao tự động ngay sau khi thanh toán thành công.' },
            { icon: Users, title: 'Cộng đồng uy tín', desc: 'Hệ thống đánh giá & huy hiệu giúp bạn chọn seller đáng tin cậy.' },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all group">
              <f.icon className="h-10 w-10 text-primary mb-4 group-hover:animate-glow" />
              <h3 className="font-heading text-lg font-semibold mb-2 text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

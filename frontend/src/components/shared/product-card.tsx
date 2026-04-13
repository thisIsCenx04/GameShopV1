'use client';
import Link from 'next/link';
import { Eye, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    gameName?: string;
    gameRankName?: string;
    price: number;
    mainImageUrl?: string;
    collaboratorName?: string;
    serverName?: string;
    isFeatured?: boolean;
  };
}

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="rounded-lg overflow-hidden bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-[var(--shadow-neon)]">
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          {product.mainImageUrl ? (
            <img
              src={product.mainImageUrl}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🎮</div>
          )}
          {product.gameName && (
            <div className="absolute top-2 left-2 flex gap-1">
              <Badge className="bg-primary/90 text-primary-foreground text-xs font-heading">
                {product.gameName}
              </Badge>
            </div>
          )}
          {product.isFeatured && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-card/80 backdrop-blur text-xs">
                <Star className="h-3 w-3 mr-1 text-warning fill-warning" /> Nổi bật
              </Badge>
            </div>
          )}
        </div>
        <div className="p-3 space-y-2">
          <h3 className="font-heading font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {product.title}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {product.gameRankName && (
              <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                {product.gameRankName}
              </Badge>
            )}
            {product.serverName && (
              <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                {product.serverName}
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="font-heading font-bold text-lg text-primary">
              {formatVND(product.price)}
            </span>
            {product.collaboratorName && (
              <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                {product.collaboratorName}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

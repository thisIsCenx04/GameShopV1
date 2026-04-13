'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ShoppingCart, Star, Eye, Shield, ArrowLeft, MessageCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { ApiResponse, ProductDetail } from '@/types';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && product?.images) {
      setLightboxIndex((lightboxIndex - 1 + product.images.length) % product.images.length);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && product?.images) {
      setLightboxIndex((lightboxIndex + 1) % product.images.length);
    }
  };

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => { const { data } = await api.get<ApiResponse<ProductDetail>>(`/products/${id}`); return data.data; },
    enabled: !!id,
  });

  if (isLoading || !product) {
    return <div className="container mx-auto px-4 py-8"><p className="text-muted-foreground text-center py-12">Đang tải...</p></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 flex-1">
      <Link href="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" /> Quay lại cửa hàng
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-3">
          <div 
            className="rounded-xl overflow-hidden bg-card border border-border/50 aspect-[4/3] cursor-pointer group relative"
            onClick={() => product.images && product.images.length > 0 && setLightboxIndex(0)}
          >
            {product.images && product.images.length > 0 ? (
              <>
                <img src={product.images[0].imageUrl} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                  <div className="bg-background/80 backdrop-blur text-foreground px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-heading text-sm">
                    Xem ảnh lớn
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">🎮</div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1).map((img, idx) => (
                <div 
                  key={img.id} 
                  className="rounded-lg overflow-hidden bg-card border border-border/50 aspect-square cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setLightboxIndex(idx + 1)}
                >
                  <img src={img.imageUrl} alt="" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className="bg-primary/90 text-primary-foreground font-heading">{product.gameName}</Badge>
              <Badge variant="outline" className="border-primary/30 text-primary">{product.gameRankName}</Badge>
              {product.gameServerName && (
                <Badge variant="outline" className="border-border text-muted-foreground">{product.gameServerName}</Badge>
              )}
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground">{product.title}</h1>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {product.viewCount} lượt xem</span>
            <span>Đăng {formatDate(product.createdAt)}</span>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border/50">
            <span className="font-heading text-3xl font-bold text-primary">{formatVND(product.price)}</span>
            <div className="flex gap-3 mt-4">
              <Button size="lg" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-semibold">
                <ShoppingCart className="h-4 w-4 mr-2" /> Mua ngay
              </Button>
              <Button size="lg" variant="outline" className="border-border/50">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <Shield className="h-3 w-3 text-success" /> Bảo vệ giao dịch — Hoàn tiền nếu tài khoản có vấn đề
            </p>
          </div>

          {/* Seller */}
          <div className="p-4 rounded-xl bg-card border border-border/50 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center font-heading font-bold text-primary text-lg">
              {(product.collaboratorName || 'S')[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-heading font-semibold text-foreground">{product.collaboratorName}</span>
                <Badge className="bg-success/10 text-success border border-success/30 text-xs">Uy tín</Badge>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-3 w-3 text-warning fill-warning" /> Người bán
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-heading font-semibold text-foreground mb-2">Mô tả</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description || 'Không có mô tả'}</p>
          </div>
        </div>
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => !open && setLightboxIndex(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-screen-lg p-0 bg-transparent border-none shadow-none" showCloseButton={false}>
          <DialogTitle className="sr-only">Hình ảnh sản phẩm</DialogTitle>
          <div className="relative w-full h-[80vh] flex items-center justify-center">
            {lightboxIndex !== null && product.images && product.images[lightboxIndex] && (
              <img 
                src={product.images[lightboxIndex].imageUrl} 
                alt={product.title} 
                className="max-w-full max-h-full object-contain rounded-md" 
              />
            )}
            
            {/* Close Button */}
            <button 
              onClick={() => setLightboxIndex(null)}
              className="absolute top-2 right-2 md:-top-4 md:-right-4 h-10 w-10 bg-background/50 backdrop-blur hover:bg-background rounded-full flex items-center justify-center text-foreground transition-colors z-50 shadow-lg"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Nav Buttons */}
            {product.images && product.images.length > 1 && (
              <>
                <button 
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 bg-background/50 backdrop-blur hover:bg-background rounded-full flex items-center justify-center text-foreground transition-colors z-50 shadow-lg"
                >
                  <ChevronLeft className="h-6 w-6 relative right-0.5" />
                </button>
                <button 
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 bg-background/50 backdrop-blur hover:bg-background rounded-full flex items-center justify-center text-foreground transition-colors z-50 shadow-lg"
                >
                  <ChevronRight className="h-6 w-6 relative left-0.5" />
                </button>
              </>
            )}
            
            {/* Indicator */}
            {product.images && product.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-background/50 backdrop-blur rounded-full text-sm font-medium">
                {(lightboxIndex ?? 0) + 1} / {product.images.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

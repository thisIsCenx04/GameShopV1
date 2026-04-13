'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ApiResponse } from '@/types';

interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  sortOrder: number;
}

export default function BannerCarousel() {
  const [current, setCurrent] = useState(0);

  const { data: banners = [] } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Banner[]>>('/banners');
      return data.data;
    },
  });

  const len = banners.length;

  const next = useCallback(() => {
    if (len > 0) setCurrent((c) => (c + 1) % len);
  }, [len]);

  const prev = useCallback(() => {
    if (len > 0) setCurrent((c) => (c - 1 + len) % len);
  }, [len]);

  // Auto-slide every 5s
  useEffect(() => {
    if (len <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [len, next]);

  if (len === 0) {
    // Fallback: simple gradient hero
    return (
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-accent/10">
        <div className="container mx-auto px-4 py-20 md:py-28 text-center">
          <h1 className="font-heading text-4xl md:text-6xl font-bold mb-4">
            <span className="text-gradient">GameStore VN</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sàn giao dịch tài khoản game uy tín hàng đầu Việt Nam
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden group">
      {/* Slides */}
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((b) => {
          const inner = (
            <div className="w-full flex-shrink-0 relative aspect-[3/1] min-h-[200px] md:min-h-[320px]">
              <img
                src={b.imageUrl}
                alt={b.title}
                className="w-full h-full object-cover"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              {b.title && (
                <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10">
                  <h2 className="font-heading text-xl md:text-3xl font-bold text-white drop-shadow-lg">
                    {b.title}
                  </h2>
                </div>
              )}
            </div>
          );

          return b.linkUrl ? (
            <Link key={b.id} href={b.linkUrl} className="w-full flex-shrink-0">
              {inner}
            </Link>
          ) : (
            <div key={b.id} className="w-full flex-shrink-0">
              {inner}
            </div>
          );
        })}
      </div>

      {/* Arrows */}
      {len > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/60 hover:bg-background/80 backdrop-blur-sm text-foreground rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/60 hover:bg-background/80 backdrop-blur-sm text-foreground rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {len > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${
                i === current
                  ? 'w-6 bg-primary'
                  : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

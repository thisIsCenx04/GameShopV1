'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/layout/protected-route';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Clock, ChevronRight } from 'lucide-react';
import type { ApiResponse, OrderListItem, PaginationMeta } from '@/types';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  Pending: { label: 'Chờ thanh toán', variant: 'secondary' },
  Paid: { label: 'Đã thanh toán', variant: 'outline' },
  Delivered: { label: 'Đã giao', variant: 'default' },
  Completed: { label: 'Hoàn thành', variant: 'default' },
  Cancelled: { label: 'Đã hủy', variant: 'destructive' },
  Disputed: { label: 'Khiếu nại', variant: 'destructive' },
};

function OrdersContent() {
  const { data: result, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const { data } = await api.get('/orders/my-purchases?pageSize=50');
      return data as ApiResponse<OrderListItem[]>;
    },
  });

  const orders = result?.data || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-xl font-bold mb-6 flex items-center gap-2"><Package className="h-5 w-5 text-primary" />Đơn mua của tôi</h1>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Đang tải...</p>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">Bạn chưa có đơn mua nào.</p>
            <Link href="/products" className="text-sm text-primary hover:underline mt-2 inline-block">Khám phá sản phẩm →</Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const st = statusMap[order.status] || { label: order.status, variant: 'secondary' as const };
            return (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground font-mono">#{order.orderCode}</span>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </div>
                        <p className="text-sm font-medium line-clamp-1">{order.productTitle}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />{new Date(order.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className="text-sm font-bold text-primary">{formatVND(order.amount)}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return <ProtectedRoute><OrdersContent /></ProtectedRoute>;
}

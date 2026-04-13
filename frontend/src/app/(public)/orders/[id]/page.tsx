'use client';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/layout/protected-route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Package, Clock, CheckCircle, Truck, Key, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ApiResponse, OrderDetail } from '@/types';
import { useAuthStore } from '@/stores/auth-store';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  Pending: { label: 'Chờ thanh toán', variant: 'secondary', color: 'text-yellow-500' },
  Paid: { label: 'Đã thanh toán', variant: 'outline', color: 'text-blue-500' },
  Delivered: { label: 'Đã giao acc', variant: 'default', color: 'text-primary' },
  Completed: { label: 'Hoàn thành', variant: 'default', color: 'text-green-500' },
  Cancelled: { label: 'Đã hủy', variant: 'destructive', color: 'text-red-500' },
  Disputed: { label: 'Khiếu nại', variant: 'destructive', color: 'text-red-500' },
};

function OrderDetailContent() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<OrderDetail>>(`/orders/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  const confirmMutation = useMutation({
    mutationFn: () => api.post(`/orders/${id}/confirm`),
    onSuccess: () => {
      toast.success('Xác nhận nhận hàng thành công!');
      qc.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Thao tác thất bại'),
  });

  if (isLoading) return <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">Đang tải...</div>;
  if (!order) return <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">Đơn hàng không tồn tại.</div>;

  const st = statusMap[order.status] || { label: order.status, variant: 'secondary' as const, color: '' };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link href="/orders" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="h-4 w-4" />Quay lại đơn mua
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />Đơn #{order.orderCode}
        </h1>
        <Badge variant={st.variant}>{st.label}</Badge>
      </div>

      {/* Order Info */}
      <Card className="mb-4">
        <CardContent className="pt-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sản phẩm</span>
            <span className="font-medium">{order.productTitle}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Game</span>
            <span>{order.gameName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Thanh toán</span>
            <span className="font-bold text-primary">{formatVND(order.amount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Ngày đặt</span>
            <span>{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
          </div>
          {order.completedAt && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Hoàn thành</span>
              <span>{new Date(order.completedAt).toLocaleString('vi-VN')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Delivery */}
      {order.accountDelivery && (
        <Card className="mb-4 border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Key className="h-4 w-4 text-primary" />Thông tin tài khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Username</span>
              <span className="font-mono bg-secondary px-2 py-0.5 rounded text-primary">{order.accountDelivery.username}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Password</span>
              <span className="font-mono bg-secondary px-2 py-0.5 rounded text-primary">{order.accountDelivery.password}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {order.status === 'Delivered' && user?.id === order.buyerId && (
        <Card className="mb-4">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">Bạn đã nhận được tài khoản? Xác nhận để hoàn tất giao dịch.</p>
            <Button onClick={() => confirmMutation.mutate()} disabled={confirmMutation.isPending} className="gap-1.5">
              <CheckCircle className="h-4 w-4" />{confirmMutation.isPending ? 'Đang xử lý...' : 'Xác nhận đã nhận hàng'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Status Timeline */}
      {order.statusLogs && order.statusLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" />Lịch sử trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.statusLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm">
                      <span className="text-muted-foreground">{log.oldStatus}</span>
                      <span className="mx-1">→</span>
                      <span className="font-medium">{log.newStatus}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(log.changedAt).toLocaleString('vi-VN')}</p>
                    {log.note && <p className="text-xs text-muted-foreground mt-0.5">{log.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  return <ProtectedRoute><OrderDetailContent /></ProtectedRoute>;
}

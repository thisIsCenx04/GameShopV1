'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/status-badge';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiResponse, OrderListItem } from '@/types';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function CollabOrders() {
  const { data: orders = [] } = useQuery({
    queryKey: ['collab-orders-all'],
    queryFn: async () => { try { const { data } = await api.get<ApiResponse<OrderListItem[]>>('/orders/my-sales'); return data.data; } catch { return []; } },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Lịch sử giao dịch</h1>

      <Card className="bg-card border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Mã đơn</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Người mua</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id} className="border-border/50">
                  <TableCell className="font-mono text-xs text-primary">{o.orderCode}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{o.productTitle}</TableCell>
                  <TableCell className="text-sm">{o.buyerName}</TableCell>
                  <TableCell className="font-heading font-semibold">{formatVND(o.amount)}</TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Chưa có đơn hàng</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

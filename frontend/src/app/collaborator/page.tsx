'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, ShoppingCart, DollarSign, Wallet, Star, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiResponse, OrderListItem, WalletInfo, ProductListItem } from '@/types';
import { useMemo } from 'react';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function CollabDashboard() {
  // Fetch CTV's own products
  const { data: products = [] } = useQuery({
    queryKey: ['collab-products-stats'],
    queryFn: async () => {
      try {
        const { data } = await api.get<ApiResponse<ProductListItem[]>>('/collaborator/products?pageSize=200');
        return data.data;
      } catch { return []; }
    },
  });

  // Fetch CTV's sales (orders where CTV is seller)
  const { data: orders = [] } = useQuery({
    queryKey: ['collab-orders-dashboard'],
    queryFn: async () => {
      try {
        const { data } = await api.get<ApiResponse<OrderListItem[]>>('/orders/my-sales?pageSize=50');
        return data.data;
      } catch { return []; }
    },
  });

  // Fetch CTV's wallet
  const { data: wallet } = useQuery({
    queryKey: ['collab-wallet'],
    queryFn: async () => {
      try {
        const { data } = await api.get<ApiResponse<WalletInfo>>('/wallet');
        return data.data;
      } catch { return null; }
    },
  });

  // Computed stats from real data
  const sellingCount = products.filter(p => p.status === 'Active').length;
  const soldCount = products.filter(p => p.status === 'Sold').length;
  const completedOrders = orders.filter(o => o.status === 'Completed' || o.status === 'Delivered');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.amount, 0);
  const pendingCount = orders.filter(o => o.status === 'Paid' || o.status === 'Pending').length;

  // Build chart data from orders grouped by date (last 7 days)
  const chartData = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      days[key] = 0;
    }
    for (const o of completedOrders) {
      const key = new Date(o.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      if (key in days) days[key] += o.amount;
    }
    return Object.entries(days).map(([date, revenue]) => ({ date, revenue }));
  }, [completedOrders]);

  const recentOrders = orders.slice(0, 5);

  const stats = [
    { label: 'Đang bán', value: String(sellingCount), icon: Package, color: 'text-primary' },
    { label: 'Đã bán', value: String(soldCount), icon: ShoppingCart, color: 'text-success' },
    { label: 'Doanh thu', value: totalRevenue > 0 ? formatVND(totalRevenue) : '0 ₫', icon: DollarSign, color: 'text-primary' },
    { label: 'Số dư ví', value: wallet ? formatVND(wallet.availableBalance) : '0 ₫', icon: Wallet, color: 'text-success' },
    { label: 'Tổng đơn', value: String(orders.length), icon: Star, color: 'text-warning' },
    { label: 'Chờ xử lý', value: String(pendingCount), icon: Clock, color: 'text-neon-purple' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <span className="font-heading text-lg font-bold text-foreground">{s.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Doanh thu 7 ngày</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
              <XAxis dataKey="date" stroke="hsl(215 15% 55%)" fontSize={12} />
              <YAxis stroke="hsl(215 15% 55%)" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip contentStyle={{ background: 'hsl(220 18% 10%)', border: '1px solid hsl(220 15% 18%)', borderRadius: '8px' }} formatter={(value: any) => [formatVND(Number(value)), 'Doanh thu']} />
              <Bar dataKey="revenue" fill="hsl(145 70% 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Đơn hàng gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Mã đơn</TableHead>
                <TableHead className="hidden md:table-cell">Người mua</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="hidden md:table-cell">Ngày</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((o) => (
                <TableRow key={o.id} className="border-border/50">
                  <TableCell className="font-mono text-xs text-primary">{o.orderCode}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{o.buyerName}</TableCell>
                  <TableCell className="font-heading font-semibold">{formatVND(o.amount)}</TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                </TableRow>
              ))}
              {recentOrders.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Chưa có đơn hàng</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

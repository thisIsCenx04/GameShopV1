'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingCart, Users, Package, Clock, AlertTriangle, Wallet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiResponse, OrderListItem } from '@/types';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

// Mock stats — replace with admin stats API when ready
const stats = [
  { label: 'Doanh thu', value: '125.000.000₫', icon: DollarSign, color: 'text-primary' },
  { label: 'Đơn hàng', value: '1.234', icon: ShoppingCart, color: 'text-success' },
  { label: 'Users mới', value: '89', icon: Users, color: 'text-neon-purple' },
  { label: 'Sản phẩm', value: '456', icon: Package, color: 'text-warning' },
  { label: 'Chờ duyệt', value: '12', icon: Clock, color: 'text-primary' },
  { label: 'Khiếu nại', value: '3', icon: AlertTriangle, color: 'text-destructive' },
  { label: 'Rút tiền', value: '5', icon: Wallet, color: 'text-success' },
];

// Mock chart data
const chartData = Array.from({ length: 7 }, (_, i) => {
  const date = new Date(Date.now() - (6 - i) * 86400000);
  return {
    date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    revenue: Math.floor(Math.random() * 20000000) + 5000000,
  };
});

export default function AdminDashboard() {
  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      try { const { data } = await api.get<ApiResponse<OrderListItem[]>>('/admin/orders?pageSize=8'); return data.data; }
      catch { return []; }
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
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
          <CardTitle className="font-heading text-lg">Doanh thu 7 ngày gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
              <XAxis dataKey="date" stroke="hsl(215 15% 55%)" fontSize={12} />
              <YAxis stroke="hsl(215 15% 55%)" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip
                contentStyle={{ background: 'hsl(220 18% 10%)', border: '1px solid hsl(220 15% 18%)', borderRadius: '8px' }}
                labelStyle={{ color: 'hsl(210 20% 92%)' }}
                formatter={(value: any) => [formatVND(Number(value)), 'Doanh thu']}
              />
              <Bar dataKey="revenue" fill="hsl(175 80% 50%)" radius={[4, 4, 0, 0]} />
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
                <TableHead className="hidden md:table-cell">Sản phẩm</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="hidden md:table-cell">Ngày</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id} className="border-border/50">
                  <TableCell className="font-mono text-xs text-primary">{o.orderCode}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm truncate max-w-[200px]">{o.productTitle}</TableCell>
                  <TableCell className="font-heading font-semibold">{formatVND(o.amount)}</TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Chưa có đơn hàng</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

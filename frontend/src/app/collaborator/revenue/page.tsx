'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiResponse, OrderListItem } from '@/types';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const chartData = Array.from({ length: 7 }, (_, i) => ({
  date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
  revenue: Math.floor(Math.random() * 20000000) + 5000000,
}));

export default function CollabRevenue() {
  const { data: orders = [] } = useQuery({
    queryKey: ['collab-orders-revenue'],
    queryFn: async () => { try { const { data } = await api.get<ApiResponse<OrderListItem[]>>('/collaborator/orders?pageSize=10'); return data.data; } catch { return []; } },
  });

  const completedOrders = orders.filter((o) => o.status === 'Completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.amount * 0.85, 0);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Doanh thu & Hoa hồng</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Tổng doanh thu</span>
            <p className="font-heading text-2xl font-bold text-primary mt-1">{formatVND(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Tỷ lệ nhận</span>
            <p className="font-heading text-2xl font-bold text-success mt-1">85%</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Admin Fee</span>
            <p className="font-heading text-2xl font-bold text-warning mt-1">15%</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader><CardTitle className="font-heading text-lg">Biểu đồ doanh thu</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
              <XAxis dataKey="date" stroke="hsl(215 15% 55%)" fontSize={12} />
              <YAxis stroke="hsl(215 15% 55%)" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip contentStyle={{ background: 'hsl(220 18% 10%)', border: '1px solid hsl(220 15% 18%)', borderRadius: '8px' }} formatter={(value: any) => [formatVND(Number(value)), 'Doanh thu']} />
              <Bar dataKey="revenue" fill="hsl(175 80% 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-card border-border/50">
        <CardHeader><CardTitle className="font-heading text-lg">Lịch sử hoa hồng</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Mã đơn</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Tỷ lệ</TableHead>
                <TableHead>Bạn nhận</TableHead>
                <TableHead>Admin Fee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedOrders.map((o) => (
                <TableRow key={o.id} className="border-border/50">
                  <TableCell className="font-mono text-xs text-primary">{o.orderCode}</TableCell>
                  <TableCell className="text-sm">{formatVND(o.amount)}</TableCell>
                  <TableCell className="text-sm text-success">85%</TableCell>
                  <TableCell className="font-heading font-semibold text-success">{formatVND(o.amount * 0.85)}</TableCell>
                  <TableCell className="text-sm text-warning">{formatVND(o.amount * 0.15)}</TableCell>
                </TableRow>
              ))}
              {completedOrders.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Chưa có dữ liệu</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

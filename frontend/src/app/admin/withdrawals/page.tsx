'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/shared/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Check, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { ApiResponse, WithdrawResponse } from '@/types';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function AdminWithdrawals() {
  const qc = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: withdrawals = [] } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: async () => {
      try {
        const { data } = await api.get<ApiResponse<WithdrawResponse[]>>('/admin/withdraws/pending');
        return data.data;
      } catch { return []; }
    },
  });

  const approveWithdraw = useMutation({
    mutationFn: (id: string) => api.post(`/admin/withdraws/${id}/approve`),
    onSuccess: () => { toast.success('Đã duyệt yêu cầu rút tiền!'); qc.invalidateQueries({ queryKey: ['admin-withdrawals'] }); },
    onError: () => toast.error('Thao tác thất bại'),
  });

  const rejectWithdraw = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/admin/withdraws/${id}/reject`, { reason: reason || undefined }),
    onSuccess: () => {
      toast.success('Đã từ chối yêu cầu rút tiền');
      setRejectId(null);
      setRejectReason('');
      qc.invalidateQueries({ queryKey: ['admin-withdrawals'] });
    },
    onError: () => toast.error('Thao tác thất bại'),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Yêu cầu rút tiền</h1>
      <p className="text-muted-foreground">Có <span className="text-primary font-semibold">{withdrawals.length}</span> yêu cầu đang chờ xử lý</p>

      <Card className="bg-card border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Collaborator</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Ngân hàng</TableHead>
                <TableHead>STK</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.map((w) => (
                <TableRow key={w.id} className="border-border/50">
                  <TableCell className="text-sm font-medium">{w.accountHolder}</TableCell>
                  <TableCell className="font-heading font-semibold text-primary">{formatVND(w.amount)}</TableCell>
                  <TableCell className="text-sm">{w.bankName}</TableCell>
                  <TableCell className="text-sm font-mono">{w.accountNumber}</TableCell>
                  <TableCell><StatusBadge status={w.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(w.createdAt)}</TableCell>
                  <TableCell>
                    {w.status === 'Pending' && (
                      <div className="flex gap-1">
                        <Button size="sm" className="bg-success text-success-foreground h-7 text-xs" onClick={() => approveWithdraw.mutate(w.id)}>
                          <Check className="h-3 w-3 mr-1" /> Duyệt
                        </Button>
                        <Button size="sm" variant="outline" className="border-destructive/50 text-destructive h-7 text-xs" onClick={() => setRejectId(w.id)}>
                          <X className="h-3 w-3 mr-1" /> Từ chối
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {withdrawals.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Không có yêu cầu rút tiền</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reject Reason Dialog */}
      <Dialog open={!!rejectId} onOpenChange={(open) => { if (!open) { setRejectId(null); setRejectReason(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Từ chối yêu cầu rút tiền</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Nhập lý do từ chối (không bắt buộc):</p>
            <Textarea
              placeholder="VD: Thông tin ngân hàng không chính xác..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="bg-secondary border-border/50"
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Hủy</DialogClose>
            <Button variant="destructive" onClick={() => rejectId && rejectWithdraw.mutate({ id: rejectId, reason: rejectReason })}>
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

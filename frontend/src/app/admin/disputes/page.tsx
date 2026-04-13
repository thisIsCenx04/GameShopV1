'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { ApiResponse, DisputeResponse } from '@/types';

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function AdminDisputes() {
  const qc = useQueryClient();
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const { data: disputes = [] } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: async () => {
      try {
        const { data } = await api.get<ApiResponse<DisputeResponse[]>>('/admin/disputes');
        return data.data;
      } catch { return []; }
    },
  });

  const resolve = useMutation({
    mutationFn: ({ id, resolution, adminNote }: { id: string; resolution: string; adminNote: string }) =>
      api.post(`/admin/disputes/${id}/resolve`, { resolution, adminNote: adminNote || undefined }),
    onSuccess: () => {
      toast.success('Đã xử lý khiếu nại');
      setResolveId(null);
      setResolution('');
      setAdminNote('');
      qc.invalidateQueries({ queryKey: ['admin-disputes'] });
    },
    onError: () => toast.error('Thao tác thất bại'),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Khiếu nại & Tranh chấp</h1>

      <Card className="bg-card border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Mã đơn</TableHead>
                <TableHead>Người báo cáo</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((d) => (
                <TableRow key={d.id} className="border-border/50">
                  <TableCell className="font-mono text-xs text-primary">{d.orderCode}</TableCell>
                  <TableCell className="text-sm">{d.reporterName}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{d.reason}</TableCell>
                  <TableCell><StatusBadge status={d.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(d.createdAt)}</TableCell>
                  <TableCell>
                    {d.status !== 'Resolved' && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setResolveId(d.id)}>Xử lý</Button>
                    )}
                    {d.status === 'Resolved' && d.resolution && (
                      <span className="text-xs text-muted-foreground truncate block max-w-[120px]" title={d.resolution}>{d.resolution}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {disputes.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Không có khiếu nại</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={!!resolveId} onOpenChange={(open) => { if (!open) { setResolveId(null); setResolution(''); setAdminNote(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Xử lý khiếu nại</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kết quả xử lý <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="VD: Hoàn tiền cho người mua, phạt người bán..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={3}
                className="bg-secondary border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Ghi chú admin (nội bộ)</Label>
              <Input
                placeholder="Ghi chú nội bộ..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="bg-secondary border-border/50"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Hủy</DialogClose>
            <Button
              className="bg-primary text-primary-foreground"
              disabled={!resolution.trim()}
              onClick={() => resolveId && resolve.mutate({ id: resolveId, resolution, adminNote })}
            >
              Xác nhận xử lý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

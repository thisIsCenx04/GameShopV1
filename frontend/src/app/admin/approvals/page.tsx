'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Check, X, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { ApiResponse, ProductListItem, ProductDetail } from '@/types';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function AdminApprovals() {
  const qc = useQueryClient();
  const [viewProduct, setViewProduct] = useState<ProductDetail | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: products = [] } = useQuery({
    queryKey: ['admin-pending-products'],
    queryFn: async () => {
      try {
        const { data } = await api.get<ApiResponse<ProductListItem[]>>('/admin/products/pending');
        return data.data;
      } catch { return []; }
    },
  });

  const approve = useMutation({
    mutationFn: (id: string) => api.post(`/admin/products/${id}/approve`),
    onSuccess: () => { toast.success('Đã duyệt sản phẩm!'); qc.invalidateQueries({ queryKey: ['admin-pending-products'] }); },
    onError: () => toast.error('Thao tác thất bại'),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/admin/products/${id}/reject`, { adminNote: reason || undefined }),
    onSuccess: () => {
      toast.success('Đã từ chối sản phẩm');
      setRejectId(null);
      setRejectReason('');
      qc.invalidateQueries({ queryKey: ['admin-pending-products'] });
    },
    onError: () => toast.error('Thao tác thất bại'),
  });

  const handleViewDetail = async (id: string) => {
    try {
      const { data } = await api.get<ApiResponse<ProductDetail>>(`/admin/products/${id}`);
      setViewProduct(data.data);
    } catch { toast.error('Không thể tải chi tiết sản phẩm'); }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Duyệt sản phẩm</h1>
      <p className="text-muted-foreground">Có <span className="text-primary font-semibold">{products.length}</span> sản phẩm đang chờ duyệt</p>

      <Card className="bg-card border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Game</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id} className="border-border/50">
                  <TableCell className="text-sm max-w-[250px]">
                    <div className="flex items-center gap-3">
                      {p.mainImageUrl ? (
                        <img src={p.mainImageUrl} alt="" className="h-10 w-14 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-14 rounded bg-secondary flex items-center justify-center text-lg opacity-30">🎮</div>
                      )}
                      <span className="truncate">{p.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{p.gameName}</TableCell>
                  <TableCell className="font-heading font-semibold text-primary">{formatVND(p.price)}</TableCell>
                  <TableCell className="text-sm">{p.collaboratorName}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Xem chi tiết" onClick={() => handleViewDetail(p.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90 h-8" onClick={() => approve.mutate(p.id)}>
                        <Check className="h-3 w-3 mr-1" /> Duyệt
                      </Button>
                      <Button size="sm" variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10 h-8" onClick={() => setRejectId(p.id)}>
                        <X className="h-3 w-3 mr-1" /> Từ chối
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Không có sản phẩm chờ duyệt</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Detail Dialog */}
      <Dialog open={!!viewProduct} onOpenChange={(open) => !open && setViewProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-heading">Chi tiết sản phẩm chờ duyệt</DialogTitle></DialogHeader>
          {viewProduct && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Tiêu đề:</span><p className="font-medium">{viewProduct.title}</p></div>
                <div><span className="text-muted-foreground">Giá:</span><p className="font-heading font-semibold text-primary">{formatVND(viewProduct.price)}</p></div>
                <div><span className="text-muted-foreground">Game:</span><p>{viewProduct.gameName}</p></div>
                <div><span className="text-muted-foreground">Hạng:</span><p>{viewProduct.gameRankName}</p></div>
                <div><span className="text-muted-foreground">Server:</span><p>{viewProduct.gameServerName || '—'}</p></div>
                <div><span className="text-muted-foreground">Seller:</span><p>{viewProduct.collaboratorName}</p></div>
              </div>
              {viewProduct.description && (
                <div><span className="text-muted-foreground">Mô tả:</span><p className="mt-1 whitespace-pre-wrap bg-secondary/50 rounded p-2 text-xs">{viewProduct.description}</p></div>
              )}
              {viewProduct.images.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Hình ảnh:</span>
                  <div className="flex gap-2 mt-1 overflow-x-auto">
                    {viewProduct.images.map((img) => (
                      <img key={img.id} src={img.imageUrl} alt="" className="h-20 w-28 rounded object-cover flex-shrink-0" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={!!rejectId} onOpenChange={(open) => { if (!open) { setRejectId(null); setRejectReason(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Từ chối sản phẩm</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Nhập lý do từ chối (không bắt buộc):</p>
            <Textarea
              placeholder="VD: Hình ảnh không rõ ràng, thiếu thông tin tài khoản..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="bg-secondary border-border/50"
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Hủy</DialogClose>
            <Button variant="destructive" onClick={() => rejectId && reject.mutate({ id: rejectId, reason: rejectReason })}>
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

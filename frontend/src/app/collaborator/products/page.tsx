'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import Link from 'next/link';
import { PlusCircle, Eye, Edit, Trash2, Send } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { ApiResponse, ProductListItem, ProductDetail } from '@/types';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function CollabProducts() {
  const qc = useQueryClient();
  const [viewProduct, setViewProduct] = useState<ProductDetail | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ['collab-products'],
    queryFn: async () => {
      try {
        const { data } = await api.get<ApiResponse<ProductListItem[]>>('/collaborator/products');
        return data.data;
      } catch { return []; }
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => api.delete(`/collaborator/products/${id}`),
    onSuccess: () => { toast.success('Đã xóa sản phẩm'); setDeleteId(null); qc.invalidateQueries({ queryKey: ['collab-products'] }); },
    onError: () => toast.error('Xóa thất bại'),
  });

  const submitForApproval = useMutation({
    mutationFn: (id: string) => api.post(`/collaborator/products/${id}/submit`),
    onSuccess: () => { toast.success('Đã gửi duyệt!'); qc.invalidateQueries({ queryKey: ['collab-products'] }); },
    onError: () => toast.error('Gửi duyệt thất bại'),
  });

  const handleViewDetail = async (id: string) => {
    try {
      const { data } = await api.get<ApiResponse<ProductDetail>>(`/collaborator/products/${id}`);
      setViewProduct(data.data);
    } catch {
      toast.error('Không thể tải chi tiết sản phẩm');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Sản phẩm của tôi</h1>
        <Link href="/collaborator/products/new">
          <Button className="bg-primary text-primary-foreground font-heading">
            <PlusCircle className="h-4 w-4 mr-2" /> Đăng sản phẩm
          </Button>
        </Link>
      </div>

      <Card className="bg-card border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Lượt xem</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="hidden md:table-cell">Ngày đăng</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id} className="border-border/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {p.mainImageUrl ? (
                        <img src={p.mainImageUrl} alt="" className="h-10 w-14 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-14 rounded bg-secondary flex items-center justify-center text-lg opacity-30">🎮</div>
                      )}
                      <div>
                        <span className="text-sm truncate block max-w-[200px]">{p.title}</span>
                        <span className="text-xs text-muted-foreground">{p.gameName}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-heading font-semibold text-primary">{formatVND(p.price)}</TableCell>
                  <TableCell className="text-sm">{p.viewCount}</TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Xem chi tiết" onClick={() => handleViewDetail(p.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {p.status === 'Draft' && (
                        <>
                          <Link href={`/collaborator/products/edit/${p.id}`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Sửa">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" title="Gửi duyệt" onClick={() => submitForApproval.mutate(p.id)}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {(p.status === 'Draft' || p.status === 'Active' || p.status === 'Hidden') && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Xóa" onClick={() => setDeleteId(p.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Chưa có sản phẩm</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Detail Dialog */}
      <Dialog open={!!viewProduct} onOpenChange={(open) => !open && setViewProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-heading">Chi tiết sản phẩm</DialogTitle></DialogHeader>
          {viewProduct && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Tiêu đề:</span><p className="font-medium">{viewProduct.title}</p></div>
                <div><span className="text-muted-foreground">Giá:</span><p className="font-heading font-semibold text-primary">{formatVND(viewProduct.price)}</p></div>
                <div><span className="text-muted-foreground">Game:</span><p>{viewProduct.gameName}</p></div>
                <div><span className="text-muted-foreground">Hạng:</span><p>{viewProduct.gameRankName}</p></div>
                <div><span className="text-muted-foreground">Server:</span><p>{viewProduct.gameServerName || '—'}</p></div>
                <div><span className="text-muted-foreground">Trạng thái:</span><p><StatusBadge status={viewProduct.status} /></p></div>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Xác nhận xóa</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Bạn có chắc muốn xóa sản phẩm này? Hành động này không thể hoàn tác.</p>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Hủy</DialogClose>
            <Button variant="destructive" onClick={() => deleteId && deleteProduct.mutate(deleteId)}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

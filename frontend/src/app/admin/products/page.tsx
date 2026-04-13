'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Search, Eye, Star, EyeOff, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { ApiResponse, ProductListItem, ProductDetail } from '@/types';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function AdminProducts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [viewProduct, setViewProduct] = useState<ProductDetail | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products', search],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        params.set('pageSize', '50');
        const { data } = await api.get<ApiResponse<ProductListItem[]>>(`/admin/products?${params}`);
        return data.data;
      } catch { return []; }
    },
  });

  const moderateProduct = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => api.post(`/admin/products/${id}/${action}`),
    onSuccess: () => { toast.success('Cập nhật thành công'); qc.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: () => toast.error('Thao tác thất bại'),
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/products/${id}`),
    onSuccess: () => { toast.success('Đã xóa sản phẩm'); setDeleteId(null); qc.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: () => toast.error('Xóa thất bại'),
  });

  const handleViewDetail = async (id: string) => {
    try {
      const { data } = await api.get<ApiResponse<ProductDetail>>(`/admin/products/${id}`);
      setViewProduct(data.data);
    } catch { toast.error('Không thể tải chi tiết sản phẩm'); }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Quản lý sản phẩm</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm sản phẩm, seller..."
          className="pl-10 bg-card border-border/50"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="bg-card border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Game</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="hidden md:table-cell">Ngày đăng</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id} className="border-border/50">
                  <TableCell className="text-sm max-w-[200px]">
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
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Xem chi tiết" onClick={() => handleViewDetail(p.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className={`h-7 w-7 ${p.isFeatured ? 'text-yellow-500' : 'text-muted-foreground'}`}
                        title={p.isFeatured ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật'}
                        onClick={() => moderateProduct.mutate({ id: p.id, action: 'toggle-featured' })}
                      >
                        <Star className="h-4 w-4" fill={p.isFeatured ? 'currentColor' : 'none'} />
                      </Button>
                      {p.status === 'Active' && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" title="Ẩn" onClick={() => moderateProduct.mutate({ id: p.id, action: 'hide' })}>
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      )}
                      {p.status === 'Hidden' && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" title="Bỏ ẩn" onClick={() => moderateProduct.mutate({ id: p.id, action: 'unhide' })}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Xóa" onClick={() => setDeleteId(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Chưa có dữ liệu</TableCell></TableRow>
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
                <div><span className="text-muted-foreground">Lượt xem:</span><p>{viewProduct.viewCount}</p></div>
                <div><span className="text-muted-foreground">Nổi bật:</span><p>{viewProduct.isFeatured ? '⭐ Có' : 'Không'}</p></div>
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
              {viewProduct.tags.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Tags:</span>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {viewProduct.tags.map((t) => (
                      <span key={t.id} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{t.name}</span>
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

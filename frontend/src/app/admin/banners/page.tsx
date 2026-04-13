'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Upload, X, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { toast } from 'sonner';
import type { ApiResponse } from '@/types';

interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  sortOrder: number;
}

const emptyForm = { title: '', imageUrl: '', linkUrl: '', isActive: true, sortOrder: 0 };

export default function AdminBannersPage() {
  const qc = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: banners = [] } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => { const { data } = await api.get<ApiResponse<Banner[]>>('/admin/banners'); return data.data; },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-banners'] });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { title: form.title, imageUrl: form.imageUrl, linkUrl: form.linkUrl || undefined, isActive: form.isActive, sortOrder: form.sortOrder };
      return editId ? api.put(`/admin/banners/${editId}`, payload) : api.post('/admin/banners', payload);
    },
    onSuccess: () => { toast.success(editId ? 'Cập nhật thành công!' : 'Tạo banner thành công!'); closeDialog(); invalidate(); },
    onError: () => toast.error('Thao tác thất bại'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/banners/${id}`),
    onSuccess: () => { toast.success('Đã xóa banner'); setDeleteId(null); invalidate(); },
  });

  const closeDialog = () => { setShowDialog(false); setEditId(null); setForm(emptyForm); };

  const openEdit = (b: Banner) => {
    setEditId(b.id);
    setForm({ title: b.title, imageUrl: b.imageUrl, linkUrl: b.linkUrl || '', isActive: b.isActive, sortOrder: b.sortOrder });
    setShowDialog(true);
  };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Vui lòng chọn file ảnh'); return; }
    setUploading(true);
    try {
      const result = await uploadToCloudinary(file);
      setForm(f => ({ ...f, imageUrl: result.secure_url }));
      toast.success('Upload thành công!');
    } catch { toast.error('Upload thất bại'); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Quản lý Banner</h1>
        <Button className="bg-primary text-primary-foreground font-heading" onClick={() => { setForm(emptyForm); setEditId(null); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Thêm banner
        </Button>
      </div>

      <Card className="bg-card border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="w-32">Preview</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Thứ tự</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map((b) => (
                <TableRow key={b.id} className="border-border/50">
                  <TableCell>
                    <img src={b.imageUrl} alt={b.title} className="h-12 w-24 rounded object-cover border border-border/50" />
                  </TableCell>
                  <TableCell className="font-medium">{b.title || <span className="text-muted-foreground italic">Không có tiêu đề</span>}</TableCell>
                  <TableCell className="text-sm">
                    {b.linkUrl ? (
                      <span className="flex items-center gap-1 text-primary">
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate max-w-[150px]">{b.linkUrl}</span>
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm">{b.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={b.isActive ? 'default' : 'outline'} className={b.isActive ? 'bg-success/20 text-success border-success/30' : 'text-muted-foreground'}>
                      {b.isActive ? 'Hiển thị' : 'Ẩn'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-400" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(b.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {banners.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Chưa có banner nào</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-heading">{editId ? 'Chỉnh sửa banner' : 'Thêm banner mới'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Tiêu đề (hiển thị trên banner)</Label>
              <Input className="bg-secondary border-border/50" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="VD: Khuyến mãi mùa hè" />
            </div>
            <div className="space-y-1">
              <Label>Hình ảnh banner</Label>
              {form.imageUrl ? (
                <div className="relative">
                  <img src={form.imageUrl} alt="" className="w-full aspect-[3/1] rounded-lg object-cover border border-border/50" />
                  <button type="button" className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1" onClick={() => setForm({ ...form, imageUrl: '' })}><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <label className="flex items-center justify-center w-full aspect-[3/1] rounded-lg border-2 border-dashed border-border/50 hover:border-primary/50 cursor-pointer transition-colors">
                  {uploading ? (
                    <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <span className="text-sm text-muted-foreground">Click để upload (khuyên 1200×400)</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
                </label>
              )}
            </div>
            <div className="space-y-1">
              <Label>Link (khi click vào banner)</Label>
              <Input className="bg-secondary border-border/50" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="/products?gameId=1 hoặc https://..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Thứ tự hiển thị</Label>
                <Input type="number" className="bg-secondary border-border/50" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label>Hiển thị</Label>
                <div className="flex items-center gap-2 pt-1">
                  <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                  <span className="text-sm text-muted-foreground">{form.isActive ? 'Đang hiển thị' : 'Đang ẩn'}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="border-border/50">Hủy</Button>} />
            <Button className="bg-primary text-primary-foreground" onClick={() => saveMutation.mutate()} disabled={!form.imageUrl || saveMutation.isPending}>
              {saveMutation.isPending ? 'Đang lưu...' : editId ? 'Lưu thay đổi' : 'Tạo banner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Xác nhận xóa</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Bạn có chắc muốn xóa banner này?</p>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="border-border/50">Hủy</Button>} />
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

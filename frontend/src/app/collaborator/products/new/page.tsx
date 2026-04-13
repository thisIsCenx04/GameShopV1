'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageUploader from '@/components/shared/image-uploader';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { ApiResponse, Game, GameDetail } from '@/types';

export default function CollabNewProduct() {
  const router = useRouter();
  const [gameId, setGameId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [rankId, setRankId] = useState('');
  const [serverId, setServerId] = useState('');
  const [form, setForm] = useState({ title: '', price: '', description: '', tags: '', username: '', password: '' });
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [detailImages, setDetailImages] = useState<string[]>([]);

  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: async () => { const { data } = await api.get<ApiResponse<Game[]>>('/games'); return data.data; },
  });

  const { data: gameDetail } = useQuery({
    queryKey: ['game-detail', gameId],
    queryFn: async () => { const { data } = await api.get<ApiResponse<GameDetail>>(`/games/${gameId}`); return data.data; },
    enabled: !!gameId,
  });

  // Derived labels for display
  const selectedGame = useMemo(() => games.find(g => String(g.id) === gameId), [games, gameId]);
  const selectedCategory = useMemo(() => gameDetail?.categories?.find(c => String(c.id) === categoryId), [gameDetail, categoryId]);
  const selectedRank = useMemo(() => gameDetail?.ranks?.find(r => String(r.id) === rankId), [gameDetail, rankId]);
  const selectedServer = useMemo(() => gameDetail?.servers?.find(s => String(s.id) === serverId), [gameDetail, serverId]);

  const createProduct = async (submitForApproval: boolean) => {
    const payload = {
      gameId: Number(gameId),
      gameCategoryId: Number(categoryId),
      gameRankId: rankId ? Number(rankId) : undefined,
      gameServerId: serverId ? Number(serverId) : undefined,
      title: form.title,
      price: Number(form.price),
      description: form.description,
      accountUsername: form.username,
      accountPassword: form.password,
      imageUrls: [...(coverImage ? [coverImage] : []), ...detailImages],
      tagIds: [] as number[],
    };
    const { data } = await api.post<ApiResponse<{ id: string }>>('/collaborator/products', payload);
    if (submitForApproval && data.data?.id) {
      await api.post(`/collaborator/products/${data.data.id}/submit`);
    }
    return data;
  };

  const submitMutation = useMutation({
    mutationFn: () => createProduct(true),
    onSuccess: () => { toast.success('Đã gửi sản phẩm để duyệt!'); router.push('/collaborator/products'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gửi sản phẩm thất bại'),
  });

  const saveDraftMutation = useMutation({
    mutationFn: () => createProduct(false),
    onSuccess: () => { toast.success('Đã lưu nháp thành công!'); router.push('/collaborator/products'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Lưu nháp thất bại'),
  });

  const isLoading = submitMutation.isPending || saveDraftMutation.isPending;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="font-heading text-2xl font-bold text-foreground">Đăng sản phẩm mới</h1>

      {/* Product Info */}
      <Card className="bg-card border-border/50">
        <CardHeader><CardTitle className="font-heading text-lg">Thông tin cơ bản</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tiêu đề sản phẩm</Label>
            <Input placeholder="VD: Acc Liên Quân Kim Cương - 50 Tướng - Full Skin" className="bg-secondary border-border/50" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Game</Label>
              <Select value={gameId} onValueChange={(v: string | null) => { setGameId(v || ''); setCategoryId(''); setRankId(''); setServerId(''); }}>
                <SelectTrigger className="bg-secondary border-border/50">
                  <SelectValue placeholder="Chọn game">{selectedGame?.name || 'Chọn game'}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {games.map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Danh mục <span className="text-destructive">*</span></Label>
              <Select value={categoryId} onValueChange={(v: string | null) => setCategoryId(v || '')} disabled={!gameId}>
                <SelectTrigger className="bg-secondary border-border/50">
                  <SelectValue placeholder="Chọn danh mục">{selectedCategory?.name || 'Chọn danh mục'}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(gameDetail?.categories || []).map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Hạng</Label>
              <Select value={rankId} onValueChange={(v: string | null) => setRankId(v || '')} disabled={!gameId}>
                <SelectTrigger className="bg-secondary border-border/50">
                  <SelectValue placeholder="Chọn hạng">{selectedRank?.name || 'Chọn hạng'}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(gameDetail?.ranks || []).map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Server</Label>
              <Select value={serverId} onValueChange={(v: string | null) => setServerId(v || '')} disabled={!gameId}>
                <SelectTrigger className="bg-secondary border-border/50">
                  <SelectValue placeholder="Chọn server">{selectedServer?.name || 'Chọn server'}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(gameDetail?.servers || []).map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Giá bán (VND)</Label>
              <Input type="number" placeholder="500000" className="bg-secondary border-border/50" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <Input placeholder="Full Skin, Rare, Không nợ (dấu phẩy)" className="bg-secondary border-border/50" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mô tả chi tiết</Label>
            <Textarea rows={4} placeholder="Mô tả chi tiết tướng, skin, trang bị, cấp độ..." className="bg-secondary border-border/50" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card className="bg-card border-border/50">
        <CardHeader><CardTitle className="font-heading text-lg">Hình ảnh sản phẩm</CardTitle></CardHeader>
        <CardContent>
          <ImageUploader
            coverImage={coverImage}
            detailImages={detailImages}
            onCoverChange={setCoverImage}
            onDetailImagesChange={setDetailImages}
          />
        </CardContent>
      </Card>

      {/* Account Credentials */}
      <Card className="bg-card border-border/50">
        <CardHeader><CardTitle className="font-heading text-lg">Thông tin tài khoản game</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tên đăng nhập</Label>
              <Input placeholder="Username tài khoản game" className="bg-secondary border-border/50" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Mật khẩu</Label>
              <Input type="password" placeholder="Sẽ được mã hóa AES-256" className="bg-secondary border-border/50" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">⚠️ Thông tin này chỉ được hiển thị cho người mua sau khi thanh toán thành công.</p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 pb-6">
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-semibold"
          onClick={() => submitMutation.mutate()}
          disabled={!form.title || !gameId || !categoryId || !form.price || !form.username || !form.password || isLoading}
        >
          {submitMutation.isPending ? 'Đang gửi...' : 'Gửi duyệt'}
        </Button>
        <Button
          variant="outline"
          className="border-border/50 font-heading"
          onClick={() => saveDraftMutation.mutate()}
          disabled={!form.title || !gameId || !categoryId || !form.price || !form.username || !form.password || isLoading}
        >
          {saveDraftMutation.isPending ? 'Đang lưu...' : 'Lưu nháp'}
        </Button>
      </div>
    </div>
  );
}

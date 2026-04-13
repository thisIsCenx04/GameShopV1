'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import ImageUploader from '@/components/shared/image-uploader';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { ApiResponse, Game, GameDetail } from '@/types';

export default function AdminNewProduct() {
  const router = useRouter();
  const [gameId, setGameId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [rankId, setRankId] = useState('');
  const [serverId, setServerId] = useState('');
  const [form, setForm] = useState({ title: '', price: '', description: '' });
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

  const selectedGame = useMemo(() => games.find(g => String(g.id) === gameId), [games, gameId]);
  const selectedCategory = useMemo(() => gameDetail?.categories?.find(c => String(c.id) === categoryId), [gameDetail, categoryId]);
  const selectedRank = useMemo(() => gameDetail?.ranks?.find(r => String(r.id) === rankId), [gameDetail, rankId]);
  const selectedServer = useMemo(() => gameDetail?.servers?.find(s => String(s.id) === serverId), [gameDetail, serverId]);

  const createMutation = useMutation({
    mutationFn: async () => {
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
      return api.post('/admin/products', payload);
    },
    onSuccess: () => {
      toast.success('Đã đăng sản phẩm thành công! (Tự động Active)');
      router.push('/admin/products');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Đăng sản phẩm thất bại'),
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <h1 className="font-heading text-2xl font-bold text-foreground">Đăng sản phẩm mới</h1>
        <Badge className="bg-primary/20 text-primary border border-primary/30 font-mono text-xs">Auto-Active</Badge>
      </div>
      <p className="text-sm text-muted-foreground -mt-4">Sản phẩm do Admin tạo sẽ được đăng ngay lập tức, không cần qua quá trình duyệt.</p>

      {/* Basic Info */}
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
          <div className="space-y-2">
            <Label>Giá bán (VND)</Label>
            <Input type="number" placeholder="500000" className="bg-secondary border-border/50 max-w-xs" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
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

      {/* Actions */}
      <div className="flex gap-3 pb-6">
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-semibold"
          onClick={() => createMutation.mutate()}
          disabled={!form.title || !gameId || !categoryId || !form.price || !form.username || !form.password || createMutation.isPending}
        >
          {createMutation.isPending ? 'Đang đăng...' : '🚀 Đăng ngay (Active)'}
        </Button>
        <Button variant="outline" className="border-border/50 font-heading" onClick={() => router.back()}>
          Hủy
        </Button>
      </div>
    </div>
  );
}

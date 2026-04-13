'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import ImageUploader from '@/components/shared/image-uploader';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import type { ApiResponse, ProductDetail, Game, GameDetail } from '@/types';

export default function CollabEditProduct() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [gameId, setGameId] = useState('');
  const [rankId, setRankId] = useState('');
  const [serverId, setServerId] = useState('');
  const [form, setForm] = useState({ title: '', price: '', description: '' });
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [detailImages, setDetailImages] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Fetch existing product
  const { data: product } = useQuery({
    queryKey: ['edit-product', productId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ProductDetail>>(`/collaborator/products/${productId}`);
      return data.data;
    },
    enabled: !!productId,
  });

  // Populate form when product data loads
  useEffect(() => {
    if (product && !loaded) {
      setGameId(String(product.gameId));
      setRankId(String(product.gameRankId));
      setServerId(product.gameServerId ? String(product.gameServerId) : '');
      setForm({
        title: product.title,
        price: String(product.price),
        description: product.description || '',
      });
      // Pre-populate images: images with IsMain → cover, rest → detail carousel
      const mainImg = product.images.find(img => img.isMain);
      const others = product.images.filter(img => !img.isMain).sort((a, b) => a.sortOrder - b.sortOrder);
      setCoverImage(mainImg?.imageUrl || null);
      setDetailImages(others.map(img => img.imageUrl));
      setLoaded(true);
    }
  }, [product, loaded]);

  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: async () => { const { data } = await api.get<ApiResponse<Game[]>>('/games'); return data.data; },
  });

  const { data: gameDetail } = useQuery({
    queryKey: ['game-detail', gameId],
    queryFn: async () => { const { data } = await api.get<ApiResponse<GameDetail>>(`/games/${gameId}`); return data.data; },
    enabled: !!gameId,
  });

  const updateProduct = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        price: Number(form.price),
        description: form.description,
        gameRankId: rankId ? Number(rankId) : undefined,
        gameServerId: serverId ? Number(serverId) : undefined,
        imageUrls: [...(coverImage ? [coverImage] : []), ...detailImages],
      };
      return api.put(`/collaborator/products/${productId}`, payload);
    },
    onSuccess: () => { toast.success('Cập nhật thành công!'); router.push('/collaborator/products'); },
    onError: () => toast.error('Cập nhật thất bại'),
  });

  if (!product && !loaded) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Đang tải...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/collaborator/products">
          <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="font-heading text-2xl font-bold text-foreground">Sửa sản phẩm</h1>
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader><CardTitle className="font-heading text-lg">Thông tin sản phẩm</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tiêu đề</Label>
            <Input className="bg-secondary border-border/50" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Game</Label>
              <Select value={gameId} disabled>
                <SelectTrigger className="bg-secondary border-border/50">
                  <SelectValue placeholder="Chọn game" />
                </SelectTrigger>
                <SelectContent>
                  {games.map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Không thể thay đổi game sau khi tạo</p>
            </div>
            <div className="space-y-2">
              <Label>Hạng</Label>
              <Select value={rankId} onValueChange={(v: string | null) => setRankId(v || '')}>
                <SelectTrigger className="bg-secondary border-border/50">
                  <SelectValue placeholder="Chọn hạng" />
                </SelectTrigger>
                <SelectContent>
                  {(gameDetail?.ranks || []).map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Server</Label>
              <Select value={serverId} onValueChange={(v: string | null) => setServerId(v || '')}>
                <SelectTrigger className="bg-secondary border-border/50">
                  <SelectValue placeholder="Chọn server" />
                </SelectTrigger>
                <SelectContent>
                  {(gameDetail?.servers || []).map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Giá bán (VND)</Label>
              <Input type="number" className="bg-secondary border-border/50" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Mô tả chi tiết</Label>
            <Textarea rows={5} className="bg-secondary border-border/50" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <ImageUploader
            coverImage={coverImage}
            detailImages={detailImages}
            onCoverChange={setCoverImage}
            onDetailImagesChange={setDetailImages}
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-semibold"
          onClick={() => updateProduct.mutate()}
          disabled={updateProduct.isPending}
        >
          {updateProduct.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
        <Link href="/collaborator/products">
          <Button variant="outline" className="border-border/50 font-heading">Hủy</Button>
        </Link>
      </div>
    </div>
  );
}

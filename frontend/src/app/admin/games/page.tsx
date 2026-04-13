'use client';
import { useState, Fragment } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Eye, ChevronDown, ChevronUp, Upload, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { toast } from 'sonner';
import type { ApiResponse, GameDetail } from '@/types';

export default function AdminGamesPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editGame, setEditGame]   = useState<GameDetail | null>(null);
  const [detailGame, setDetailGame] = useState<GameDetail | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState({ name: '', slug: '', iconUrl: '', displayOrder: '0' });
  const [editForm, setEditForm]     = useState({ name: '', slug: '', iconUrl: '', displayOrder: '0', isActive: true });
  const [addRank, setAddRank] = useState<{ gameId: number; name: string; iconUrl: string; order: string } | null>(null);
  const [addServer, setAddServer] = useState<{ gameId: number; name: string } | null>(null);
  const [addCategory, setAddCategory] = useState<{ gameId: number; name: string; slug: string; coverImageUrl: string; displayOrder: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: games = [] } = useQuery({
    queryKey: ['admin-games'],
    queryFn: async () => { const { data } = await api.get<ApiResponse<GameDetail[]>>('/games'); return data.data; },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-games'] });

  // --- CRUD Mutations ---
  const createGame = useMutation({
    mutationFn: (payload: typeof createForm) => api.post('/admin/games', {
      name: payload.name, slug: payload.slug, iconUrl: payload.iconUrl || undefined, displayOrder: Number(payload.displayOrder),
    }),
    onSuccess: () => { toast.success('Tạo game thành công!'); setShowCreate(false); setCreateForm({ name: '', slug: '', iconUrl: '', displayOrder: '0' }); invalidate(); },
    onError: () => toast.error('Tạo game thất bại'),
  });

  const updateGame = useMutation({
    mutationFn: () => api.put(`/admin/games/${editGame?.id}`, {
      name: editForm.name, slug: editForm.slug, iconUrl: editForm.iconUrl || undefined,
      displayOrder: Number(editForm.displayOrder), isActive: editForm.isActive,
    }),
    onSuccess: () => { toast.success('Cập nhật thành công!'); setEditGame(null); invalidate(); },
    onError: () => toast.error('Cập nhật thất bại'),
  });

  const addRankMut = useMutation({
    mutationFn: () => api.post(`/admin/games/${addRank?.gameId}/ranks`, { name: addRank?.name, iconUrl: addRank?.iconUrl || undefined, order: Number(addRank?.order || 0) }),
    onSuccess: () => { toast.success('Thêm rank thành công!'); setAddRank(null); invalidate(); },
    onError: () => toast.error('Thêm rank thất bại'),
  });

  const addServerMut = useMutation({
    mutationFn: () => api.post(`/admin/games/${addServer?.gameId}/servers`, { name: addServer?.name }),
    onSuccess: () => { toast.success('Thêm server thành công!'); setAddServer(null); invalidate(); },
    onError: () => toast.error('Thêm server thất bại'),
  });

  const addCategoryMut = useMutation({
    mutationFn: () => api.post(`/admin/games/${addCategory?.gameId}/categories`, { name: addCategory?.name, slug: addCategory?.slug || undefined, coverImageUrl: addCategory?.coverImageUrl || undefined, displayOrder: Number(addCategory?.displayOrder || 0), isActive: true }),
    onSuccess: () => { toast.success('Thêm danh mục thành công!'); setAddCategory(null); invalidate(); },
    onError: () => toast.error('Thêm danh mục thất bại'),
  });

  const deleteRank = useMutation({
    mutationFn: ({ gameId, rankId }: { gameId: number; rankId: number }) => api.delete(`/admin/games/${gameId}/ranks/${rankId}`),
    onSuccess: () => { toast.success('Đã xóa rank'); invalidate(); },
  });

  const deleteServer = useMutation({
    mutationFn: ({ gameId, serverId }: { gameId: number; serverId: number }) => api.delete(`/admin/games/${gameId}/servers/${serverId}`),
    onSuccess: () => { toast.success('Đã xóa server'); invalidate(); },
  });

  const deleteCategory = useMutation({
    mutationFn: ({ gameId, categoryId }: { gameId: number; categoryId: number }) => api.delete(`/admin/games/${gameId}/categories/${categoryId}`),
    onSuccess: () => { toast.success('Đã xóa danh mục'); invalidate(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Không thể xóa danh mục đang có sản phẩm'),
  });

  const handleIconUpload = async (file: File, target: 'create' | 'edit' | 'category') => {
    if (!file.type.startsWith('image/')) { toast.error('Vui lòng chọn file ảnh'); return; }
    setUploading(true);
    try {
      const result = await uploadToCloudinary(file);
      if (target === 'create') setCreateForm(f => ({ ...f, iconUrl: result.secure_url }));
      else if (target === 'edit') setEditForm(f => ({ ...f, iconUrl: result.secure_url }));
      else if (target === 'category') setAddCategory(f => f ? { ...f, coverImageUrl: result.secure_url } : null);
      toast.success('Upload thành công!');
    } catch { toast.error('Upload thất bại'); }
    finally { setUploading(false); }
  };

  const openEdit = (g: GameDetail) => {
    setEditGame(g);
    setEditForm({ name: g.name, slug: g.slug, iconUrl: g.iconUrl || '', displayOrder: String(g.displayOrder), isActive: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Quản lý thể loại game</h1>
        <Button className="bg-primary text-primary-foreground font-heading" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Thêm game
        </Button>
      </div>

      <Card className="bg-card border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="w-12">Icon</TableHead>
                <TableHead>Tên game</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Thứ tự</TableHead>
                <TableHead>Ranks</TableHead>
                <TableHead>Servers</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games.map((g) => (
                <Fragment key={g.id}>
                  <TableRow className="border-border/50">
                    <TableCell>
                      {g.iconUrl ? (
                        <img src={g.iconUrl} alt={g.name} className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center text-xs text-muted-foreground">🎮</div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">{g.slug}</TableCell>
                    <TableCell className="text-sm">{g.displayOrder}</TableCell>
                    <TableCell><Badge variant="outline" className="border-border/50">{g.ranks.length}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="border-border/50">{g.servers.length}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedId(expandedId === g.id ? null : g.id)}>
                          {expandedId === g.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-400" onClick={() => setDetailGame(g)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-400" onClick={() => openEdit(g)}><Pencil className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {/* Expanded: Ranks & Servers */}
                  {expandedId === g.id && (
                    <TableRow key={`${g.id}-detail`} className="bg-secondary/30">
                      <TableCell colSpan={7} className="p-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Ranks */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-heading font-semibold text-foreground">Ranks ({g.ranks.length})</span>
                              <Button size="sm" variant="outline" className="h-7 text-xs border-border/50" onClick={() => setAddRank({ gameId: g.id, name: '', iconUrl: '', order: '0' })}>
                                <Plus className="h-3 w-3 mr-1" /> Thêm
                              </Button>
                            </div>
                            <div className="space-y-1">
                              {g.ranks.map((r) => (
                                <div key={r.id} className="flex items-center justify-between rounded px-2 py-1 hover:bg-secondary/50">
                                  <div className="flex items-center gap-2">
                                    {r.iconUrl ? <img src={r.iconUrl} className="h-5 w-5 rounded" alt="" /> : null}
                                    <span className="text-sm">{r.name}</span>
                                    <span className="text-xs text-muted-foreground">#{r.order}</span>
                                  </div>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteRank.mutate({ gameId: g.id, rankId: r.id })}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                              {g.ranks.length === 0 && <p className="text-xs text-muted-foreground">Chưa có rank</p>}
                            </div>
                          </div>
                          {/* Servers */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-heading font-semibold text-foreground">Servers ({g.servers.length})</span>
                              <Button size="sm" variant="outline" className="h-7 text-xs border-border/50" onClick={() => setAddServer({ gameId: g.id, name: '' })}>
                                <Plus className="h-3 w-3 mr-1" /> Thêm
                              </Button>
                            </div>
                            <div className="space-y-1">
                              {g.servers.map((s) => (
                                <div key={s.id} className="flex items-center justify-between rounded px-2 py-1 hover:bg-secondary/50">
                                  <span className="text-sm">{s.name}</span>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteServer.mutate({ gameId: g.id, serverId: s.id })}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                              {g.servers.length === 0 && <p className="text-xs text-muted-foreground">Chưa có server</p>}
                            </div>
                        </div>
                          {/* Categories */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-heading font-semibold text-foreground">Danh mục ({g.categories?.length || 0})</span>
                              <Button size="sm" variant="outline" className="h-7 text-xs border-border/50" onClick={() => setAddCategory({ gameId: g.id, name: '', slug: '', coverImageUrl: '', displayOrder: '0' })}>
                                <Plus className="h-3 w-3 mr-1" /> Thêm
                              </Button>
                            </div>
                            <div className="space-y-1">
                              {g.categories?.map((c) => (
                                <div key={c.id} className="flex items-center justify-between rounded px-2 py-1 hover:bg-secondary/50">
                                  <div className="flex items-center gap-2">
                                    {c.coverImageUrl ? <img src={c.coverImageUrl} className="h-6 w-8 rounded object-cover" alt="" /> : null}
                                    <span className="text-sm line-clamp-1" title={c.name}>{c.name}</span>
                                    <span className="text-xs text-muted-foreground">#{c.displayOrder}</span>
                                  </div>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive flex-shrink-0" onClick={() => deleteCategory.mutate({ gameId: g.id, categoryId: c.id })}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                              {(!g.categories || g.categories.length === 0) && <p className="text-xs text-muted-foreground">Chưa có danh mục</p>}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
              {games.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Chưa có game nào</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Game Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) setShowCreate(false); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Thêm game mới</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Tên game</Label>
              <Input className="bg-secondary border-border/50" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} />
            </div>
            <div className="space-y-1">
              <Label>Slug</Label>
              <Input className="bg-secondary border-border/50" value={createForm.slug} onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Thứ tự hiển thị</Label>
              <Input type="number" className="bg-secondary border-border/50" value={createForm.displayOrder} onChange={(e) => setCreateForm({ ...createForm, displayOrder: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Icon game</Label>
              <div className="flex items-center gap-3">
                {createForm.iconUrl ? (
                  <div className="relative">
                    <img src={createForm.iconUrl} alt="" className="h-12 w-12 rounded-lg object-cover border border-border/50" />
                    <button type="button" className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5" onClick={() => setCreateForm({ ...createForm, iconUrl: '' })}><X className="h-3 w-3" /></button>
                  </div>
                ) : (
                  <label className="h-12 w-12 rounded-lg border-2 border-dashed border-border/50 hover:border-primary/50 cursor-pointer flex items-center justify-center transition-colors">
                    {uploading ? <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleIconUpload(e.target.files[0], 'create')} />
                  </label>
                )}
                <span className="text-xs text-muted-foreground">Upload icon game (48×48)</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="border-border/50">Hủy</Button>} />
            <Button className="bg-primary text-primary-foreground" onClick={() => createGame.mutate(createForm)} disabled={!createForm.name || !createForm.slug || createGame.isPending}>
              {createGame.isPending ? 'Đang tạo...' : 'Tạo game'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Game Dialog */}
      <Dialog open={!!editGame} onOpenChange={(open) => { if (!open) setEditGame(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Chỉnh sửa: {editGame?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Tên game</Label>
              <Input className="bg-secondary border-border/50" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Slug</Label>
              <Input className="bg-secondary border-border/50" value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Thứ tự hiển thị</Label>
              <Input type="number" className="bg-secondary border-border/50" value={editForm.displayOrder} onChange={(e) => setEditForm({ ...editForm, displayOrder: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Icon game</Label>
              <div className="flex items-center gap-3">
                {editForm.iconUrl ? (
                  <div className="relative">
                    <img src={editForm.iconUrl} alt="" className="h-12 w-12 rounded-lg object-cover border border-border/50" />
                    <button type="button" className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5" onClick={() => setEditForm({ ...editForm, iconUrl: '' })}><X className="h-3 w-3" /></button>
                  </div>
                ) : (
                  <label className="h-12 w-12 rounded-lg border-2 border-dashed border-border/50 hover:border-primary/50 cursor-pointer flex items-center justify-center transition-colors">
                    {uploading ? <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleIconUpload(e.target.files[0], 'edit')} />
                  </label>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="border-border/50">Hủy</Button>} />
            <Button className="bg-primary text-primary-foreground" onClick={() => updateGame.mutate()} disabled={updateGame.isPending}>
              {updateGame.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailGame} onOpenChange={(open) => { if (!open) setDetailGame(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-heading">Chi tiết: {detailGame?.name}</DialogTitle></DialogHeader>
          {detailGame && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {detailGame.iconUrl ? <img src={detailGame.iconUrl} className="h-16 w-16 rounded-xl object-cover border border-border/50" alt="" /> : <div className="h-16 w-16 rounded-xl bg-secondary flex items-center justify-center text-2xl">🎮</div>}
                <div>
                  <p className="font-heading font-bold text-lg">{detailGame.name}</p>
                  <p className="text-sm text-muted-foreground font-mono">{detailGame.slug}</p>
                  <p className="text-xs text-muted-foreground">Thứ tự: {detailGame.displayOrder}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-heading font-semibold mb-1">Ranks ({detailGame.ranks.length})</p>
                  {detailGame.ranks.map(r => (
                    <div key={r.id} className="text-sm flex items-center gap-1 py-0.5">
                      {r.iconUrl && <img src={r.iconUrl} className="h-4 w-4 rounded" alt="" />}
                      <span>{r.name}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-heading font-semibold mb-1">Servers ({detailGame.servers.length})</p>
                  {detailGame.servers.map(s => <p key={s.id} className="text-sm py-0.5">{s.name}</p>)}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="border-border/50">Đóng</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Rank Dialog */}
      <Dialog open={!!addRank} onOpenChange={(open) => { if (!open) setAddRank(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Thêm Rank</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Tên rank</Label><Input className="bg-secondary border-border/50" value={addRank?.name || ''} onChange={(e) => setAddRank(addRank ? { ...addRank, name: e.target.value } : null)} /></div>
            <div className="space-y-1"><Label>Thứ tự</Label><Input type="number" className="bg-secondary border-border/50" value={addRank?.order || '0'} onChange={(e) => setAddRank(addRank ? { ...addRank, order: e.target.value } : null)} /></div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="border-border/50">Hủy</Button>} />
            <Button className="bg-primary text-primary-foreground" onClick={() => addRankMut.mutate()} disabled={!addRank?.name || addRankMut.isPending}>
              {addRankMut.isPending ? 'Đang thêm...' : 'Thêm rank'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Server Dialog */}
      <Dialog open={!!addServer} onOpenChange={(open) => { if (!open) setAddServer(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Thêm Server</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Tên server</Label><Input className="bg-secondary border-border/50" value={addServer?.name || ''} onChange={(e) => setAddServer(addServer ? { ...addServer, name: e.target.value } : null)} /></div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="border-border/50">Hủy</Button>} />
            <Button className="bg-primary text-primary-foreground" onClick={() => addServerMut.mutate()} disabled={!addServer?.name || addServerMut.isPending}>
              {addServerMut.isPending ? 'Đang thêm...' : 'Thêm server'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Add Category Dialog */}
      <Dialog open={!!addCategory} onOpenChange={(open) => { if (!open) setAddCategory(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Thêm Danh Mục</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Tên danh mục</Label>
              <Input className="bg-secondary border-border/50" value={addCategory?.name || ''} onChange={(e) => setAddCategory(addCategory ? { ...addCategory, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') } : null)} />
            </div>
            <div className="space-y-1">
              <Label>Slug</Label>
              <Input className="bg-secondary border-border/50" value={addCategory?.slug || ''} onChange={(e) => setAddCategory(addCategory ? { ...addCategory, slug: e.target.value } : null)} />
            </div>
             <div className="space-y-1">
              <Label>Thứ tự hiển thị</Label>
              <Input type="number" className="bg-secondary border-border/50" value={addCategory?.displayOrder || '0'} onChange={(e) => setAddCategory(addCategory ? { ...addCategory, displayOrder: e.target.value } : null)} />
            </div>
            <div className="space-y-1">
              <Label>Ảnh nền (Cover)</Label>
              <div className="flex items-center gap-3">
                {addCategory?.coverImageUrl ? (
                  <div className="relative">
                    <img src={addCategory.coverImageUrl} alt="" className="h-12 w-16 rounded-lg object-cover border border-border/50" />
                    <button type="button" className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5" onClick={() => setAddCategory(addCategory ? { ...addCategory, coverImageUrl: '' } : null)}><X className="h-3 w-3" /></button>
                  </div>
                ) : (
                  <label className="h-12 w-16 rounded-lg border-2 border-dashed border-border/50 hover:border-primary/50 cursor-pointer flex items-center justify-center transition-colors">
                    {uploading ? <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleIconUpload(e.target.files[0], 'category')} />
                  </label>
                )}
                <span className="text-xs text-muted-foreground">Upload ảnh nền (tỉ lệ khuyên dùng 4:3)</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="border-border/50">Hủy</Button>} />
            <Button className="bg-primary text-primary-foreground" onClick={() => addCategoryMut.mutate()} disabled={!addCategory?.name || !addCategory?.slug || addCategoryMut.isPending}>
              {addCategoryMut.isPending ? 'Đang thêm...' : 'Thêm danh mục'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

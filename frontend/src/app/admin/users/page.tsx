'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Search, UserPlus, Eye, Pencil, Lock, Unlock,
  Wallet, User, ShieldCheck, Star, TrendingUp, Award
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { ApiResponse, UserProfile, AdminUserDetail } from '@/types';

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const formatMoney = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

const ROLE_OPTIONS = [
  { value: 'Customer', label: 'Customer', color: 'border-border text-muted-foreground' },
  { value: 'Collaborator', label: 'CTV', color: 'border-primary/30 text-primary' },
  { value: 'Admin', label: 'Admin', color: 'border-neon-purple/30 text-neon-purple' },
];

export default function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [detailUser, setDetailUser] = useState<AdminUserDetail | null>(null);
  const [editUser, setEditUser] = useState<AdminUserDetail | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // ===== Role change dialog =====
  const [roleChangeTarget, setRoleChangeTarget] = useState<{ userId: string; currentRole: string; newRole: string } | null>(null);
  const [roleChangeFeeRate, setRoleChangeFeeRate] = useState('15');
  const [roleChangeInsurance, setRoleChangeInsurance] = useState('0');
  const [roleChangeNote, setRoleChangeNote] = useState('');

  // ===== Edit form state =====
  const [editForm, setEditForm] = useState({ fullName: '', phoneNumber: '', adminFeeRate: '' });

  // ===== Wallet adjustment =====
  const [walletAmount, setWalletAmount] = useState('');
  const [walletNote, setWalletNote] = useState('');

  // ===== Queries & Mutations =====
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => { try { const { data } = await api.get<ApiResponse<UserProfile[]>>('/admin/users'); return data.data; } catch { return []; } },
  });

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const s = search.toLowerCase();
    return users.filter(u => u.email.toLowerCase().includes(s) || (u.fullName?.toLowerCase() || '').includes(s));
  }, [users, search]);

  const fetchUserDetail = async (userId: string) => {
    const { data } = await api.get<ApiResponse<AdminUserDetail>>(`/admin/users/${userId}`);
    return data.data;
  };

  const changeRole = useMutation({
    mutationFn: (params: { userId: string; role: string; adminFeeRate?: number; insuranceAmount?: number; adminNote?: string }) =>
      api.post(`/admin/users/${params.userId}/change-role`, {
        role: params.role,
        adminFeeRate: params.adminFeeRate,
        insuranceAmount: params.insuranceAmount,
        adminNote: params.adminNote,
      }),
    onSuccess: () => { toast.success('Đã thay đổi vai trò'); qc.invalidateQueries({ queryKey: ['admin-users'] }); setRoleChangeTarget(null); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Thao tác thất bại'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => api.post(`/admin/users/${id}/${action}`),
    onSuccess: () => { toast.success('Cập nhật thành công'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Thao tác thất bại'),
  });

  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/admin/users/${id}`, data),
    onSuccess: () => { toast.success('Cập nhật thành công'); qc.invalidateQueries({ queryKey: ['admin-users'] }); setShowEditDialog(false); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Cập nhật thất bại'),
  });

  const adjustWallet = useMutation({
    mutationFn: ({ userId, amount, note }: { userId: string; amount: number; note: string }) =>
      api.post(`/admin/users/${userId}/adjust-wallet`, { amount, note }),
    onSuccess: (_, vars) => {
      toast.success(`Đã điều chỉnh ví: ${vars.amount > 0 ? '+' : ''}${vars.amount.toLocaleString('vi-VN')} ₫`);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setWalletAmount('');
      setWalletNote('');
      // Refresh edit user detail
      if (editUser) fetchUserDetail(editUser.id).then(setEditUser);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Điều chỉnh ví thất bại'),
  });

  // ===== Handlers =====
  const handleViewDetail = async (userId: string) => {
    try {
      const detail = await fetchUserDetail(userId);
      setDetailUser(detail);
      setShowDetailDialog(true);
    } catch { toast.error('Không thể tải thông tin người dùng'); }
  };

  const handleOpenEdit = async (userId: string) => {
    try {
      const detail = await fetchUserDetail(userId);
      setEditUser(detail);
      setEditForm({
        fullName: detail.fullName || '',
        phoneNumber: detail.phoneNumber || '',
        adminFeeRate: detail.adminFeeRate != null ? String(detail.adminFeeRate * 100) : '',
      });
      setWalletAmount('');
      setWalletNote('');
      setShowEditDialog(true);
    } catch { toast.error('Không thể tải thông tin người dùng'); }
  };

  const handleRoleChange = (userId: string, currentRole: string, newRole: string) => {
    if (currentRole === 'Admin' || newRole === 'Admin') { toast.error('Không thể thay đổi vai trò Admin'); return; }
    if (currentRole === newRole) return;

    if (newRole === 'Collaborator') {
      setRoleChangeTarget({ userId, currentRole, newRole });
      setRoleChangeFeeRate('15');
      setRoleChangeInsurance('0');
      setRoleChangeNote('');
    } else {
      // Direct role change (demote to Customer)
      changeRole.mutate({ userId, role: newRole });
    }
  };

  const handleConfirmRoleChange = () => {
    if (!roleChangeTarget) return;
    changeRole.mutate({
      userId: roleChangeTarget.userId,
      role: roleChangeTarget.newRole,
      adminFeeRate: parseFloat(roleChangeFeeRate) / 100,
      insuranceAmount: parseFloat(roleChangeInsurance) || 0,
      adminNote: roleChangeNote || undefined,
    });
  };

  const handleSaveEdit = () => {
    if (!editUser) return;
    const data: any = {};
    if (editForm.fullName) data.fullName = editForm.fullName;
    if (editForm.phoneNumber) data.phoneNumber = editForm.phoneNumber;
    if (editForm.adminFeeRate && editUser.role === 'Collaborator') {
      data.adminFeeRate = parseFloat(editForm.adminFeeRate) / 100;
    }
    updateUser.mutate({ id: editUser.id, data });
  };

  const handleAdjustWallet = () => {
    if (!editUser || !walletAmount || !walletNote.trim()) {
      toast.error('Vui lòng nhập số tiền và ghi chú');
      return;
    }
    adjustWallet.mutate({ userId: editUser.id, amount: parseFloat(walletAmount), note: walletNote });
  };

  const getRoleBadgeClass = (role: string) => ROLE_OPTIONS.find(r => r.value === role)?.color || 'border-border';

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-foreground">Quản lý người dùng</h1>
          <Button className="bg-primary text-primary-foreground font-heading">
            <UserPlus className="h-4 w-4 mr-2" /> Thêm Collaborator
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm email, họ tên..."
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
                  <TableHead>Email</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead className="w-[140px]">Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="hidden md:table-cell">Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id} className="border-border/50 group">
                    <TableCell className="text-sm font-medium">{u.email}</TableCell>
                    <TableCell className="text-sm">{u.fullName || '—'}</TableCell>
                    <TableCell>
                      {u.role === 'Admin' ? (
                        <Badge variant="outline" className={getRoleBadgeClass('Admin')}>Admin</Badge>
                      ) : (
                        <Select
                          value={u.role}
                          onValueChange={(v) => v && handleRoleChange(u.id, u.role, v)}
                        >
                          <SelectTrigger className="h-7 w-[120px] text-xs border-border/50 bg-transparent">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Customer">Customer</SelectItem>
                            <SelectItem value="Collaborator">CTV</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={u.isActive ? 'bg-success/10 text-success border-success/30' : 'bg-destructive/10 text-destructive border-destructive/30'}>
                        {u.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Tooltip>
                          <TooltipTrigger render={<Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleViewDetail(u.id)} />}>
                            <Eye className="h-3.5 w-3.5" />
                          </TooltipTrigger>
                          <TooltipContent>Xem chi tiết</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger render={<Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleOpenEdit(u.id)} />}>
                            <Pencil className="h-3.5 w-3.5" />
                          </TooltipTrigger>
                          <TooltipContent>Chỉnh sửa</TooltipContent>
                        </Tooltip>
                        {u.role !== 'Admin' && (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className={`h-7 w-7 ${u.isActive ? 'text-muted-foreground hover:text-destructive' : 'text-muted-foreground hover:text-success'}`}
                                  onClick={() => toggleActive.mutate({ id: u.id, action: u.isActive ? 'suspend' : 'activate' })}
                                />
                              }
                            >
                              {u.isActive ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                            </TooltipTrigger>
                            <TooltipContent>{u.isActive ? 'Khóa tài khoản' : 'Mở khóa'}</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Không tìm thấy người dùng</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ==================== ROLE CHANGE DIALOG (CTV setup) ==================== */}
        <Dialog open={!!roleChangeTarget} onOpenChange={(open) => { if (!open) setRoleChangeTarget(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">Nâng cấp lên Collaborator</DialogTitle>
              <DialogDescription>Thiết lập hoa hồng và bảo hiểm cho CTV mới</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Phí hoa hồng Admin (%)</Label>
                <Input
                  type="number" min="0" max="100" step="0.5"
                  value={roleChangeFeeRate}
                  onChange={(e) => setRoleChangeFeeRate(e.target.value)}
                  className="bg-secondary border-border/50"
                  placeholder="15"
                />
                <p className="text-xs text-muted-foreground">Mặc định 15%. Admin sẽ nhận % này trên mỗi giao dịch.</p>
              </div>
              <div className="space-y-2">
                <Label>Tiền bảo hiểm (VND)</Label>
                <Input
                  type="number" min="0"
                  value={roleChangeInsurance}
                  onChange={(e) => setRoleChangeInsurance(e.target.value)}
                  className="bg-secondary border-border/50"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <Textarea
                  value={roleChangeNote}
                  onChange={(e) => setRoleChangeNote(e.target.value)}
                  className="bg-secondary border-border/50 resize-none"
                  rows={2}
                  placeholder="Ghi chú cho hợp đồng..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRoleChangeTarget(null)}>Hủy</Button>
              <Button className="bg-primary text-primary-foreground" onClick={handleConfirmRoleChange} disabled={changeRole.isPending}>
                {changeRole.isPending ? 'Đang xử lý...' : 'Xác nhận'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ==================== VIEW DETAIL DIALOG ==================== */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Chi tiết người dùng
              </DialogTitle>
              <DialogDescription>Thông tin đầy đủ của tài khoản</DialogDescription>
            </DialogHeader>
            {detailUser && (
              <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
                {/* Profile */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div><span className="text-muted-foreground">Email:</span></div>
                  <div className="font-medium">{detailUser.email}</div>
                  <div><span className="text-muted-foreground">Họ tên:</span></div>
                  <div className="font-medium">{detailUser.fullName || '—'}</div>
                  <div><span className="text-muted-foreground">Vai trò:</span></div>
                  <div><Badge variant="outline" className={getRoleBadgeClass(detailUser.role)}>{detailUser.role}</Badge></div>
                  <div><span className="text-muted-foreground">Trạng thái:</span></div>
                  <div>
                    <Badge variant="outline" className={detailUser.isActive ? 'bg-success/10 text-success border-success/30' : 'bg-destructive/10 text-destructive border-destructive/30'}>
                      {detailUser.isActive ? 'Hoạt động' : 'Bị khóa'}
                    </Badge>
                  </div>
                  <div><span className="text-muted-foreground">SĐT:</span></div>
                  <div className="font-medium">{detailUser.phoneNumber || '—'}</div>
                  <div><span className="text-muted-foreground">Ngày tạo:</span></div>
                  <div className="font-medium">{formatDate(detailUser.createdAt)}</div>
                </div>

                <Separator />

                {/* Wallet */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-primary" /> Ví tiền
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-secondary/50 text-center">
                      <p className="text-xs text-muted-foreground">Tổng</p>
                      <p className="text-sm font-bold text-foreground">{formatMoney(detailUser.walletBalance)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50 text-center">
                      <p className="text-xs text-muted-foreground">Đóng băng</p>
                      <p className="text-sm font-bold text-yellow-500">{formatMoney(detailUser.walletFrozenBalance)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50 text-center">
                      <p className="text-xs text-muted-foreground">Khả dụng</p>
                      <p className="text-sm font-bold text-primary">{formatMoney(detailUser.walletAvailableBalance)}</p>
                    </div>
                  </div>
                </div>

                {/* Collaborator Info */}
                {detailUser.role === 'Collaborator' && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                        <ShieldCheck className="h-4 w-4 text-primary" /> Thông tin CTV
                      </h4>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div><span className="text-muted-foreground">Hoa hồng:</span></div>
                        <div className="font-medium">{detailUser.adminFeeRate != null ? `${(detailUser.adminFeeRate * 100).toFixed(1)}%` : '—'}</div>
                        <div><span className="text-muted-foreground">Bảo hiểm:</span></div>
                        <div className="font-medium">{detailUser.insuranceAmount != null ? formatMoney(detailUser.insuranceAmount) : '—'}</div>
                        <div><span className="text-muted-foreground">Hợp đồng:</span></div>
                        <div className="font-medium">{detailUser.contractStatus || '—'}</div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-secondary/50 text-center">
                        <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
                        <p className="text-xs text-muted-foreground">Đã bán</p>
                        <p className="text-sm font-bold">{detailUser.totalSold ?? 0}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary/50 text-center">
                        <Star className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
                        <p className="text-xs text-muted-foreground">Đánh giá</p>
                        <p className="text-sm font-bold">{detailUser.avgRating?.toFixed(1) ?? '0.0'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary/50 text-center">
                        <Award className="h-4 w-4 mx-auto mb-1 text-primary" />
                        <p className="text-xs text-muted-foreground">Cấp bậc</p>
                        <p className="text-sm font-bold">{detailUser.badgeLevel ?? 'New'}</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Bank Info */}
                {(detailUser.bankName || detailUser.bankAccountNumber) && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Ngân hàng</h4>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div><span className="text-muted-foreground">Ngân hàng:</span></div>
                        <div className="font-medium">{detailUser.bankName || '—'}</div>
                        <div><span className="text-muted-foreground">Số TK:</span></div>
                        <div className="font-medium">{detailUser.bankAccountNumber || '—'}</div>
                        <div><span className="text-muted-foreground">Chủ TK:</span></div>
                        <div className="font-medium">{detailUser.bankAccountName || '—'}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Đóng</Button>
              <Button onClick={() => { setShowDetailDialog(false); if (detailUser) handleOpenEdit(detailUser.id); }}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" /> Chỉnh sửa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ==================== EDIT DIALOG ==================== */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" /> Chỉnh sửa người dùng
              </DialogTitle>
              <DialogDescription>{editUser?.email}</DialogDescription>
            </DialogHeader>
            {editUser && (
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
                  {editUser.role === 'Collaborator' && <TabsTrigger value="commission">Hoa hồng</TabsTrigger>}
                  <TabsTrigger value="wallet">Ví tiền</TabsTrigger>
                </TabsList>

                {/* Tab: Profile */}
                <TabsContent value="profile" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Họ tên</Label>
                    <Input
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      className="bg-secondary border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Số điện thoại</Label>
                    <Input
                      value={editForm.phoneNumber}
                      onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                      className="bg-secondary border-border/50"
                    />
                  </div>
                  <Button className="w-full bg-primary text-primary-foreground" onClick={handleSaveEdit} disabled={updateUser.isPending}>
                    {updateUser.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                </TabsContent>

                {/* Tab: Commission (CTV only) */}
                {editUser.role === 'Collaborator' && (
                  <TabsContent value="commission" className="space-y-4 mt-4">
                    <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Hoa hồng hiện tại:</span>
                        <span className="font-bold text-primary">{editUser.adminFeeRate != null ? `${(editUser.adminFeeRate * 100).toFixed(1)}%` : 'Chưa thiết lập'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tiền bảo hiểm:</span>
                        <span className="font-bold">{editUser.insuranceAmount != null ? formatMoney(editUser.insuranceAmount) : '—'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Trạng thái HĐ:</span>
                        <Badge variant="outline" className="text-xs border-primary/30 text-primary">{editUser.contractStatus || '—'}</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Hoa hồng mới (%)</Label>
                      <Input
                        type="number" min="0" max="100" step="0.5"
                        value={editForm.adminFeeRate}
                        onChange={(e) => setEditForm({ ...editForm, adminFeeRate: e.target.value })}
                        className="bg-secondary border-border/50"
                        placeholder={editUser.adminFeeRate != null ? String(editUser.adminFeeRate * 100) : '15'}
                      />
                    </div>
                    <Button className="w-full bg-primary text-primary-foreground" onClick={handleSaveEdit} disabled={updateUser.isPending}>
                      {updateUser.isPending ? 'Đang lưu...' : 'Cập nhật hoa hồng'}
                    </Button>
                  </TabsContent>
                )}

                {/* Tab: Wallet */}
                <TabsContent value="wallet" className="space-y-4 mt-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-secondary/50 text-center">
                      <p className="text-xs text-muted-foreground">Tổng</p>
                      <p className="text-sm font-bold">{formatMoney(editUser.walletBalance)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50 text-center">
                      <p className="text-xs text-muted-foreground">Đóng băng</p>
                      <p className="text-sm font-bold text-yellow-500">{formatMoney(editUser.walletFrozenBalance)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50 text-center">
                      <p className="text-xs text-muted-foreground">Khả dụng</p>
                      <p className="text-sm font-bold text-primary">{formatMoney(editUser.walletAvailableBalance)}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Điều chỉnh số dư</h4>
                    <div className="space-y-2">
                      <Label>Số tiền (VND)</Label>
                      <Input
                        type="number"
                        value={walletAmount}
                        onChange={(e) => setWalletAmount(e.target.value)}
                        className="bg-secondary border-border/50"
                        placeholder="VD: 100000 (cộng) hoặc -50000 (trừ)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ghi chú <span className="text-destructive">*</span></Label>
                      <Textarea
                        value={walletNote}
                        onChange={(e) => setWalletNote(e.target.value)}
                        className="bg-secondary border-border/50 resize-none"
                        rows={2}
                        placeholder="Lý do điều chỉnh..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-success/90 hover:bg-success text-white"
                        disabled={adjustWallet.isPending || !walletAmount || !walletNote.trim() || parseFloat(walletAmount) <= 0}
                        onClick={() => {
                          const amt = Math.abs(parseFloat(walletAmount));
                          if (amt > 0) adjustWallet.mutate({ userId: editUser.id, amount: amt, note: walletNote });
                        }}
                      >
                        + Cộng tiền
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                        disabled={adjustWallet.isPending || !walletAmount || !walletNote.trim() || parseFloat(walletAmount) <= 0}
                        onClick={() => {
                          const amt = Math.abs(parseFloat(walletAmount));
                          if (amt > 0) adjustWallet.mutate({ userId: editUser.id, amount: -amt, note: walletNote });
                        }}
                      >
                        − Trừ tiền
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

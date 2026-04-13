'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import ProtectedRoute from '@/components/layout/protected-route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { User, Mail, Phone, Calendar, Shield } from 'lucide-react';
import type { ApiResponse, UserProfile } from '@/types';

function ProfileContent() {
  const { user, setUser } = useAuthStore();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<UserProfile>>('/users/me');
      return data.data;
    },
  });

  const p = profile || user;

  const [form, setForm] = useState({
    fullName: p?.fullName || '',
    phoneNumber: p?.phoneNumber || '',
    avatarUrl: p?.avatarUrl || '',
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => api.put('/users/me', data),
    onSuccess: async () => {
      toast.success('Cập nhật hồ sơ thành công!');
      const { data } = await api.get<ApiResponse<UserProfile>>('/users/me');
      setUser(data.data);
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Cập nhật thất bại'),
  });

  if (!p) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-xl font-bold mb-6">Hồ sơ cá nhân</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />Thông tin tài khoản
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              <span>{p.email}</span>
            </div>
            <Badge variant={p.isActive ? 'default' : 'destructive'}>
              {p.isActive ? 'Hoạt động' : 'Bị khóa'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Vai trò:</span>
            <Badge variant="outline">{p.role}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Ngày tham gia:</span>
            <span>{new Date(p.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chỉnh sửa hồ sơ</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(form); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input id="phone" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} placeholder="0123 456 789" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar">URL ảnh đại diện</Label>
              <Input id="avatar" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://..." />
            </div>
            <Separator />
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Đang lưu...' : 'Cập nhật hồ sơ'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return <ProtectedRoute><ProfileContent /></ProtectedRoute>;
}

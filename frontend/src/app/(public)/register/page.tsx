'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gamepad2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Mật khẩu không khớp'); return; }
    setLoading(true);
    try {
      await api.post('/auth/register', { fullName: form.fullName, email: form.email, password: form.password });
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Gamepad2 className="h-8 w-8 text-primary" />
            <span className="font-heading text-2xl font-bold text-gradient">GameStore VN</span>
          </Link>
          <h1 className="font-heading text-2xl font-bold text-foreground">Đăng ký</h1>
          <p className="text-sm text-muted-foreground mt-1">Tạo tài khoản mới</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-card border border-border/50 space-y-4">
          <div className="space-y-2">
            <Label>Họ tên</Label>
            <Input placeholder="Nguyễn Văn A" className="bg-secondary border-border/50" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="email@example.com" className="bg-secondary border-border/50" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Mật khẩu</Label>
            <Input type="password" placeholder="••••••••" className="bg-secondary border-border/50" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Xác nhận mật khẩu</Label>
            <Input type="password" placeholder="••••••••" className="bg-secondary border-border/50" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
          </div>
          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-semibold" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Đã có tài khoản? <Link href="/login" className="text-primary hover:underline font-medium">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gamepad2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { ApiResponse, TokenResponse, UserProfile } from '@/types';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Step 1: Authenticate — get tokens
      const { data: loginRes } = await api.post<ApiResponse<TokenResponse>>('/auth/login', { email, password });
      const { accessToken, refreshToken } = loginRes.data;

      // Store token immediately so the next request can use it
      localStorage.setItem('token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      // Step 2: Fetch user profile
      const { data: profileRes } = await api.get<ApiResponse<UserProfile>>('/users/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Step 3: Persist auth state
      login(accessToken, profileRes.data);
      toast.success('Đăng nhập thành công!');
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại');
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
          <h1 className="font-heading text-2xl font-bold text-foreground">Đăng nhập</h1>
          <p className="text-sm text-muted-foreground mt-1">Chào mừng bạn quay trở lại</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-card border border-border/50 space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="email@example.com" className="bg-secondary border-border/50" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Mật khẩu</Label>
            <Input type="password" placeholder="••••••••" className="bg-secondary border-border/50" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-semibold" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">hoặc</span></div>
          </div>

          <Button variant="outline" className="w-full border-border/50" type="button">
            <img src="https://www.google.com/favicon.ico" alt="Google" className="h-4 w-4 mr-2" /> Google
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Chưa có tài khoản? <Link href="/register" className="text-primary hover:underline font-medium">Đăng ký</Link>
        </p>
        <div className="text-center text-xs text-muted-foreground space-x-3">
          <Link href="/admin" className="hover:text-primary">Admin Panel →</Link>
          <Link href="/collaborator" className="hover:text-primary">Collaborator Panel →</Link>
        </div>
      </div>
    </div>
  );
}

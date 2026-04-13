'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad2, Search, Bell, User, Menu, X, Sun, Moon, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const isAdmin = pathname.startsWith('/admin');
  const isCollab = pathname.startsWith('/collaborator');

  useEffect(() => {
    const saved = localStorage.getItem('gs-theme') as 'dark' | 'light' | null;
    const t = saved || 'dark';
    setTheme(t);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(t);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(next);
    localStorage.setItem('gs-theme', next);
  };

  if (isAdmin || isCollab) return null;

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Gamepad2 className="h-7 w-7 text-primary" />
          <span className="font-heading text-xl font-bold text-gradient">GameStore VN</span>
        </Link>

        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm tài khoản game..."
              className="pl-10 bg-secondary border-border/50 focus:border-primary"
            />
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Link href="/products">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground font-heading">
              Cửa hàng
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={toggleTheme} title="Chuyển theme">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {user ? (
            <>
              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <Bell className="h-5 w-5" />
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="hidden sm:flex text-sm h-8 gap-2 border-border/50" />}>
                  <User className="h-3.5 w-3.5" />
                  <span className="max-w-[120px] truncate">{user.fullName || user.email}</span>
                  <Wallet className="h-3 w-3 text-primary" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.fullName || user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.role}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem><Link href="/profile" className="w-full">Hồ sơ</Link></DropdownMenuItem>
                  <DropdownMenuItem><Link href="/wallet" className="w-full">Ví tiền</Link></DropdownMenuItem>
                  <DropdownMenuItem><Link href="/orders" className="w-full">Đơn mua</Link></DropdownMenuItem>
                  {user.role === 'Collaborator' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem><Link href="/collaborator" className="w-full">Kênh bán hàng</Link></DropdownMenuItem>
                    </>
                  )}
                  {user.role === 'Admin' && (
                    <DropdownMenuItem><Link href="/admin" className="w-full">Admin Panel</Link></DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">Đăng xuất</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-semibold">
                <User className="h-4 w-4 mr-1" /> Đăng nhập
              </Button>
            </Link>
          )}
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 p-4 space-y-3 glass">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm kiếm..." className="pl-10 bg-secondary" />
          </div>
          <Link href="/products" className="block py-2 text-muted-foreground hover:text-foreground font-heading" onClick={() => setMobileOpen(false)}>Cửa hàng</Link>
          {user ? (
            <>
              <Link href="/profile" className="block py-2 text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(false)}>Hồ sơ</Link>
              <Link href="/wallet" className="block py-2 text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(false)}>Ví tiền</Link>
              <Button variant="outline" className="w-full border-destructive/50 text-destructive" onClick={() => { logout(); setMobileOpen(false); }}>Đăng xuất</Button>
            </>
          ) : (
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              <Button className="w-full bg-primary text-primary-foreground font-heading">Đăng nhập</Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

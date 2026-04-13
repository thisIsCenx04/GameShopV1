'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from '@/components/ui/sidebar';
import { Gamepad2, LayoutDashboard, Users, Package, PlusCircle, CheckSquare, AlertTriangle, Wallet, Settings, LogOut, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProtectedRoute from '@/components/layout/protected-route';

const adminMenuItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Banner', url: '/admin/banners', icon: Image },
  { title: 'Người dùng', url: '/admin/users', icon: Users },
  { title: 'Thể loại game', url: '/admin/games', icon: Gamepad2 },
  { title: 'Sản phẩm', url: '/admin/products', icon: Package },
  { title: 'Đăng sản phẩm', url: '/admin/products/new', icon: PlusCircle },
  { title: 'Duyệt sản phẩm', url: '/admin/approvals', icon: CheckSquare },
  { title: 'Khiếu nại', url: '/admin/disputes', icon: AlertTriangle },
  { title: 'Rút tiền', url: '/admin/withdrawals', icon: Wallet },
  { title: 'Cấu hình', url: '/admin/settings', icon: Settings },
];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar collapsible="icon" className="border-r border-border/50">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 py-3">
                <Link href="/admin" className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5 text-primary" />
                  <span className="font-heading font-bold text-gradient">Admin Panel</span>
                </Link>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminMenuItems.map((item) => {
                    const isActive = item.url === '/admin' ? pathname === '/admin' : pathname.startsWith(item.url);
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          render={<Link href={item.url} />}
                          isActive={isActive}
                          className={cn(
                            isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link href="/" />}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <LogOut className="h-4 w-4" /> Về trang chủ
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border/50 px-4 bg-card/50 shrink-0">
            <SidebarTrigger className="mr-3" />
            <span className="font-heading font-semibold text-foreground">Quản trị hệ thống</span>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute roles={['Admin']}>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </ProtectedRoute>
  );
}

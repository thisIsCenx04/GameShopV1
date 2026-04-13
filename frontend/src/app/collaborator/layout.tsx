'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from '@/components/ui/sidebar';
import { Gamepad2, LayoutDashboard, Package, BarChart3, Wallet, History, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProtectedRoute from '@/components/layout/protected-route';

const collabMenuItems = [
  { title: 'Dashboard', url: '/collaborator', icon: LayoutDashboard },
  { title: 'Sản phẩm', url: '/collaborator/products', icon: Package },
  { title: 'Doanh thu', url: '/collaborator/revenue', icon: BarChart3 },
  { title: 'Ví tiền', url: '/collaborator/wallet', icon: Wallet },
  { title: 'Lịch sử đơn hàng', url: '/collaborator/orders', icon: History },
];

function CollaboratorLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar collapsible="icon" className="border-r border-border/50">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 py-3">
                <Link href="/collaborator" className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5 text-primary" />
                  <span className="font-heading font-bold text-gradient">Seller Panel</span>
                </Link>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {collabMenuItems.map((item) => {
                    const isActive = item.url === '/collaborator' ? pathname === '/collaborator' : pathname.startsWith(item.url) && item.url !== '/collaborator';
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
            <span className="font-heading font-semibold text-foreground">Kênh người bán</span>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function CollaboratorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute roles={['Collaborator', 'Admin']}>
      <CollaboratorLayoutInner>{children}</CollaboratorLayoutInner>
    </ProtectedRoute>
  );
}

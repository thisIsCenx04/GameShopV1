'use client';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import { FloatingActions } from '@/components/shared/floating-actions';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingActions />
    </div>
  );
}

import { Gamepad2 } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/50 mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Gamepad2 className="h-6 w-6 text-primary" />
              <span className="font-heading text-lg font-bold text-gradient">GameStore VN</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Sàn giao dịch tài khoản game uy tín hàng đầu Việt Nam.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-3 text-foreground">Danh mục</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-primary transition-colors">Liên Quân Mobile</Link></li>
              <li><Link href="/products" className="hover:text-primary transition-colors">Free Fire</Link></li>
              <li><Link href="/products" className="hover:text-primary transition-colors">PUBG Mobile</Link></li>
              <li><Link href="/products" className="hover:text-primary transition-colors">Genshin Impact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-3 text-foreground">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Hướng dẫn mua hàng</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Chính sách hoàn tiền</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Liên hệ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-3 text-foreground">Liên hệ</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Email: support@gamestoreVN.com</li>
              <li>Zalo: 0123 456 789</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border/50 text-center text-xs text-muted-foreground">
          © 2026 GameStore VN. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

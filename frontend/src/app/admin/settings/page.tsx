'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function AdminSettings() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="font-heading text-2xl font-bold text-foreground">Cấu hình hệ thống</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Hoa hồng mặc định</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tỷ lệ Admin Fee mặc định (%)</Label>
              <Input type="number" defaultValue="15" className="bg-secondary border-border/50" />
            </div>
            <p className="text-xs text-muted-foreground">
              Tỷ lệ này áp dụng cho tất cả giao dịch, trừ khi có cấu hình riêng theo game hoặc Collaborator.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Auto-approve</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Trust Score tối thiểu để auto-approve</Label>
              <Input type="number" defaultValue="80" className="bg-secondary border-border/50" />
            </div>
            <p className="text-xs text-muted-foreground">
              Collaborator có Trust Score ≥ giá trị này sẽ được auto-approve sản phẩm.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 md:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Thanh toán & Giao dịch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Hạn mức rút tiền tối thiểu (VND)</Label>
                <Input type="number" defaultValue="100000" className="bg-secondary border-border/50" />
              </div>
              <div className="space-y-2">
                <Label>Thời gian khóa sản phẩm khi mua (phút)</Label>
                <Input type="number" defaultValue="5" className="bg-secondary border-border/50" />
              </div>
              <div className="space-y-2">
                <Label>Thời gian tự động xác nhận đơn (giờ)</Label>
                <Input type="number" defaultValue="24" className="bg-secondary border-border/50" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-semibold">
        Lưu cấu hình
      </Button>
    </div>
  );
}

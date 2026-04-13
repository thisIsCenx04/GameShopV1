'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/layout/protected-route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import type { ApiResponse, WalletInfo, WalletTransaction, PaginationMeta } from '@/types';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

interface WithdrawResponse {
  id: string; amount: number; bankName: string; accountNumber: string; accountHolder: string; status: string; createdAt: string;
}

function WalletContent() {
  const qc = useQueryClient();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', bankName: '', accountNumber: '', accountHolder: '' });
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => { const { data } = await api.get<ApiResponse<WalletInfo>>('/wallet'); return data.data; },
  });

  const { data: txResult } = useQuery({
    queryKey: ['wallet-transactions'],
    queryFn: async () => {
      const { data } = await api.get('/wallet/transactions?pageSize=20');
      return data as ApiResponse<WalletTransaction[]>;
    },
  });

  const { data: withdrawsResult } = useQuery({
    queryKey: ['my-withdraws'],
    queryFn: async () => {
      const { data } = await api.get('/wallet/withdraws?pageSize=20');
      return data as ApiResponse<WithdrawResponse[]>;
    },
  });

  const depositMutation = useMutation({
    mutationFn: (amount: number) => api.post('/wallet/deposit', { amount }),
    onSuccess: () => {
      toast.success('Nạp tiền thành công!');
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['wallet-transactions'] });
      setDepositAmount('');
      setDepositOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Nạp tiền thất bại'),
  });

  const withdrawMutation = useMutation({
    mutationFn: (data: { amount: number; bankName: string; accountNumber: string; accountHolder: string }) =>
      api.post('/wallet/withdraw', data),
    onSuccess: () => {
      toast.success('Yêu cầu rút tiền đã được gửi!');
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['my-withdraws'] });
      setWithdrawForm({ amount: '', bankName: '', accountNumber: '', accountHolder: '' });
      setWithdrawOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Rút tiền thất bại'),
  });

  const transactions = txResult?.data || [];
  const withdraws = withdrawsResult?.data || [];

  const txTypeIcon = (type: string) => {
    if (type.includes('Deposit') || type.includes('Earning')) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-xl font-bold mb-6 flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" />Ví của tôi</h1>

      {/* Balance Card */}
      <Card className="mb-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tổng số dư</p>
              <p className="text-xl font-bold text-foreground">{formatVND(wallet?.balance || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Khả dụng</p>
              <p className="text-xl font-bold text-primary">{formatVND(wallet?.availableBalance || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Đang đóng băng</p>
              <p className="text-xl font-bold text-accent">{formatVND(wallet?.frozenBalance || 0)}</p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex gap-3 justify-center">
            <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
              <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
                <ArrowDownCircle className="h-4 w-4" />Nạp tiền
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nạp tiền vào ví</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Số tiền (VNĐ)</Label>
                    <Input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="100000" min="10000" />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[50000, 100000, 200000, 500000, 1000000].map((v) => (
                      <Button key={v} variant="outline" size="sm" onClick={() => setDepositAmount(String(v))}>{formatVND(v)}</Button>
                    ))}
                  </div>
                  <Button className="w-full" onClick={() => depositMutation.mutate(Number(depositAmount))} disabled={!depositAmount || depositMutation.isPending}>
                    {depositMutation.isPending ? 'Đang xử lý...' : 'Xác nhận nạp'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
              <DialogTrigger render={<Button size="sm" variant="outline" className="gap-1.5" />}>
                <ArrowUpCircle className="h-4 w-4" />Rút tiền
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Yêu cầu rút tiền</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Số tiền (VNĐ)</Label>
                    <Input type="number" value={withdrawForm.amount} onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })} placeholder="100000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Ngân hàng</Label>
                    <Input value={withdrawForm.bankName} onChange={(e) => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })} placeholder="Vietcombank" />
                  </div>
                  <div className="space-y-2">
                    <Label>Số tài khoản</Label>
                    <Input value={withdrawForm.accountNumber} onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })} placeholder="1234567890" />
                  </div>
                  <div className="space-y-2">
                    <Label>Chủ tài khoản</Label>
                    <Input value={withdrawForm.accountHolder} onChange={(e) => setWithdrawForm({ ...withdrawForm, accountHolder: e.target.value })} placeholder="NGUYEN VAN A" />
                  </div>
                  <Button className="w-full" disabled={withdrawMutation.isPending}
                    onClick={() => withdrawMutation.mutate({ ...withdrawForm, amount: Number(withdrawForm.amount) })}>
                    {withdrawMutation.isPending ? 'Đang xử lý...' : 'Gửi yêu cầu rút'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="transactions">
        <TabsList className="w-full">
          <TabsTrigger value="transactions" className="flex-1">Lịch sử giao dịch</TabsTrigger>
          <TabsTrigger value="withdraws" className="flex-1">Yêu cầu rút tiền</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardContent className="pt-4">
              {transactions.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">Chưa có giao dịch nào.</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-none">
                      <div className="flex items-center gap-3">
                        {txTypeIcon(tx.type)}
                        <div>
                          <p className="text-sm font-medium">{tx.type}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />{new Date(tx.createdAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {tx.amount > 0 ? '+' : ''}{formatVND(tx.amount)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Sau: {formatVND(tx.balanceAfter)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdraws">
          <Card>
            <CardContent className="pt-4">
              {withdraws.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">Chưa có yêu cầu rút tiền nào.</p>
              ) : (
                <div className="space-y-2">
                  {withdraws.map((w) => (
                    <div key={w.id} className="flex items-center justify-between py-2 border-b border-border last:border-none">
                      <div>
                        <p className="text-sm font-medium">{formatVND(w.amount)}</p>
                        <p className="text-xs text-muted-foreground">{w.bankName} - {w.accountNumber}</p>
                        <p className="text-xs text-muted-foreground">{new Date(w.createdAt).toLocaleString('vi-VN')}</p>
                      </div>
                      <Badge variant={w.status === 'Approved' ? 'default' : w.status === 'Rejected' ? 'destructive' : 'secondary'}>
                        {w.status === 'Pending' ? 'Chờ duyệt' : w.status === 'Approved' ? 'Đã duyệt' : 'Từ chối'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function WalletPage() {
  return <ProtectedRoute><WalletContent /></ProtectedRoute>;
}

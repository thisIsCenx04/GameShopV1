'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { ApiResponse, WalletInfo, WalletTransaction, WithdrawResponse } from '@/types';

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function CollabWallet() {
  const qc = useQueryClient();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', bankName: '', accountNumber: '', accountHolder: '' });

  const { data: wallet } = useQuery({
    queryKey: ['collab-wallet'],
    queryFn: async () => { try { const { data } = await api.get<ApiResponse<WalletInfo>>('/wallet'); return data.data; } catch { return null; } },
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['collab-wallet-transactions'],
    queryFn: async () => { try { const { data } = await api.get<ApiResponse<WalletTransaction[]>>('/wallet/transactions'); return data.data; } catch { return []; } },
  });

  const { data: withdrawals = [] } = useQuery({
    queryKey: ['collab-withdrawals'],
    queryFn: async () => { try { const { data } = await api.get<ApiResponse<WithdrawResponse[]>>('/wallet/withdraws'); return data.data; } catch { return []; } },
  });

  const deposit = useMutation({
    mutationFn: () => api.post('/wallet/deposit', { amount: Number(depositAmount), note: depositNote || undefined }),
    onSuccess: () => {
      toast.success('Nạp tiền thành công!');
      setShowDeposit(false);
      setDepositAmount('');
      setDepositNote('');
      qc.invalidateQueries({ queryKey: ['collab-wallet'] });
      qc.invalidateQueries({ queryKey: ['collab-wallet-transactions'] });
    },
    onError: () => toast.error('Nạp tiền thất bại'),
  });

  const withdraw = useMutation({
    mutationFn: () => api.post('/wallet/withdraw', {
      amount: Number(withdrawForm.amount),
      bankName: withdrawForm.bankName,
      accountNumber: withdrawForm.accountNumber,
      accountHolder: withdrawForm.accountHolder,
    }),
    onSuccess: () => {
      toast.success('Yêu cầu rút tiền đã được gửi!');
      setShowWithdraw(false);
      setWithdrawForm({ amount: '', bankName: '', accountNumber: '', accountHolder: '' });
      qc.invalidateQueries({ queryKey: ['collab-wallet'] });
      qc.invalidateQueries({ queryKey: ['collab-wallet-transactions'] });
      qc.invalidateQueries({ queryKey: ['collab-withdrawals'] });
    },
    onError: () => toast.error('Gửi yêu cầu rút tiền thất bại'),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Ví tiền</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border/50 neon-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Số dư khả dụng</span>
            </div>
            <p className="font-heading text-3xl font-bold text-primary">{formatVND(wallet?.availableBalance || 0)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-5">
            <span className="text-sm text-muted-foreground">Đang giữ (Escrow)</span>
            <p className="font-heading text-2xl font-bold text-warning mt-1">{formatVND(wallet?.frozenBalance || 0)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-5 space-y-3">
            <Button className="w-full bg-primary text-primary-foreground font-heading" onClick={() => setShowWithdraw(true)}>
              <ArrowUpRight className="h-4 w-4 mr-2" /> Rút tiền
            </Button>
            <Button variant="outline" className="w-full border-border/50 font-heading" onClick={() => setShowDeposit(true)}>
              <ArrowDownLeft className="h-4 w-4 mr-2" /> Nạp tiền
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader><CardTitle className="font-heading text-lg">Lịch sử ví</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Loại</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Số dư sau</TableHead>
                <TableHead>Ngày</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id} className="border-border/50">
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.type === 'Deposit' ? 'bg-success/10 text-success' :
                      t.type === 'Withdraw' ? 'bg-orange-500/10 text-orange-500' :
                      t.type === 'Freeze' ? 'bg-blue-500/10 text-blue-500' :
                      t.type === 'Commission' ? 'bg-primary/10 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>{t.type}</span>
                  </TableCell>
                  <TableCell className="text-sm">{t.description || t.type}</TableCell>
                  <TableCell className={`font-heading font-semibold ${t.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                    {t.amount > 0 ? '+' : ''}{formatVND(Math.abs(t.amount))}
                  </TableCell>
                  <TableCell className="text-sm">{formatVND(t.balanceAfter)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(t.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Chưa có giao dịch</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Withdrawal Requests */}
      {withdrawals.length > 0 && (
        <Card className="bg-card border-border/50">
          <CardHeader><CardTitle className="font-heading text-lg">Lệnh rút tiền</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Ngân hàng</TableHead>
                  <TableHead>STK</TableHead>
                  <TableHead>Chủ TK</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead>Ngày</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((w) => (
                  <TableRow key={w.id} className="border-border/50">
                    <TableCell className="font-heading font-semibold text-primary">{formatVND(w.amount)}</TableCell>
                    <TableCell className="text-sm">{w.bankName}</TableCell>
                    <TableCell className="text-sm font-mono">{w.accountNumber}</TableCell>
                    <TableCell className="text-sm">{w.accountHolder}</TableCell>
                    <TableCell><StatusBadge status={w.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{w.adminNote || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(w.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Deposit Dialog */}
      <Dialog open={showDeposit} onOpenChange={(open) => { if (!open) { setShowDeposit(false); setDepositAmount(''); setDepositNote(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Nạp tiền vào ví</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Số tiền (VND) <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                placeholder="100000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="bg-secondary border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Input
                placeholder="VD: Nạp tiền qua Momo"
                value={depositNote}
                onChange={(e) => setDepositNote(e.target.value)}
                className="bg-secondary border-border/50"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Hủy</DialogClose>
            <Button
              className="bg-primary text-primary-foreground"
              disabled={!depositAmount || Number(depositAmount) <= 0}
              onClick={() => deposit.mutate()}
            >
              {deposit.isPending ? 'Đang xử lý...' : 'Nạp tiền'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdraw} onOpenChange={(open) => { if (!open) { setShowWithdraw(false); setWithdrawForm({ amount: '', bankName: '', accountNumber: '', accountHolder: '' }); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Yêu cầu rút tiền</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Số tiền rút (VND) <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                placeholder="100000"
                value={withdrawForm.amount}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                className="bg-secondary border-border/50"
              />
              <p className="text-xs text-muted-foreground">Số dư khả dụng: {formatVND(wallet?.availableBalance || 0)}</p>
            </div>
            <div className="space-y-2">
              <Label>Ngân hàng <span className="text-destructive">*</span></Label>
              <Input
                placeholder="VD: Vietcombank"
                value={withdrawForm.bankName}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })}
                className="bg-secondary border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Số tài khoản <span className="text-destructive">*</span></Label>
              <Input
                placeholder="0123456789"
                value={withdrawForm.accountNumber}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })}
                className="bg-secondary border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Chủ tài khoản <span className="text-destructive">*</span></Label>
              <Input
                placeholder="NGUYEN VAN A"
                value={withdrawForm.accountHolder}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, accountHolder: e.target.value })}
                className="bg-secondary border-border/50"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Hủy</DialogClose>
            <Button
              className="bg-primary text-primary-foreground"
              disabled={!withdrawForm.amount || !withdrawForm.bankName || !withdrawForm.accountNumber || !withdrawForm.accountHolder}
              onClick={() => withdraw.mutate()}
            >
              {withdraw.isPending ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

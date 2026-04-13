'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/layout/protected-route';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Bell, Check, CheckCheck, Clock } from 'lucide-react';
import type { ApiResponse, NotificationItem } from '@/types';

function NotificationsContent() {
  const qc = useQueryClient();

  const { data: result, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications?pageSize=50');
      return data as ApiResponse<NotificationItem[]>;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => {
      toast.success('Đã đánh dấu tất cả đã đọc');
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = result?.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />Thông báo
          {unreadCount > 0 && <Badge variant="destructive" className="text-xs">{unreadCount}</Badge>}
        </h1>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending} className="gap-1.5">
            <CheckCheck className="h-4 w-4" />Đọc tất cả
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Đang tải...</p>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">Chưa có thông báo nào.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={`cursor-pointer transition-colors ${!n.isRead ? 'border-primary/30 bg-primary/5' : ''}`}
              onClick={() => { if (!n.isRead) markReadMutation.mutate(n.id); }}>
              <CardContent className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                      <h3 className="text-sm font-medium">{n.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{n.body}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />{new Date(n.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  {n.isRead && <Check className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return <ProtectedRoute><NotificationsContent /></ProtectedRoute>;
}

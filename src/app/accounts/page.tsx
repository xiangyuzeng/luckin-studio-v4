'use client';

import { useState } from 'react';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useI18n } from '@/hooks/use-i18n';
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from '@/hooks/use-accounts';
import type { Account } from '@/types/account';
import { toast } from 'sonner';

interface AccountFormData {
  name: string;
  apiKey: string;
  dailyQuota: number;
  notes: string;
  isPrimary: boolean;
}

const emptyForm: AccountFormData = {
  name: '',
  apiKey: '',
  dailyQuota: 50,
  notes: '',
  isPrimary: false,
};

function maskApiKey(key: string): string {
  if (key.length <= 8) return '****';
  return key.slice(0, 4) + '****' + key.slice(-4);
}

export default function AccountsPage() {
  const { t, locale } = useI18n();
  const { data, isLoading } = useAccounts();
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deleteMutation = useDeleteAccount();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<AccountFormData>(emptyForm);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  const accounts = data?.accounts || [];

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEditDialog = (account: Account) => {
    setEditingId(account.id);
    setForm({
      name: account.name,
      apiKey: account.api_key,
      dailyQuota: account.daily_quota,
      notes: account.notes || '',
      isPrimary: !!account.is_primary,
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error(locale === 'cn' ? '请输入账户名称' : 'Please enter account name');
      return;
    }
    if (!form.apiKey.trim()) {
      toast.error(locale === 'cn' ? '请输入 API Key' : 'Please enter API key');
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          name: form.name,
          apiKey: form.apiKey,
          dailyQuota: form.dailyQuota,
          notes: form.notes || undefined,
          isPrimary: form.isPrimary,
        });
        toast.success(locale === 'cn' ? '账户已更新' : 'Account updated');
      } else {
        await createMutation.mutateAsync({
          name: form.name,
          apiKey: form.apiKey,
          dailyQuota: form.dailyQuota,
          notes: form.notes || undefined,
          isPrimary: form.isPrimary,
        });
        toast.success(locale === 'cn' ? '账户已创建' : 'Account created');
      }
      setFormOpen(false);
    } catch {
      toast.error(locale === 'cn' ? '操作失败' : 'Operation failed');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      toast.success(locale === 'cn' ? '账户已删除' : 'Account deleted');
      setDeleteConfirmOpen(false);
      setDeletingId(null);
    } catch {
      toast.error(locale === 'cn' ? '删除失败' : 'Delete failed');
    }
  };

  const toggleRevealKey = (id: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('accounts.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {locale === 'cn'
              ? '管理 KIE.AI API 账户和配额'
              : 'Manage KIE.AI API accounts and quotas'}
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          {t('accounts.add')}
        </Button>
      </div>

      {/* Accounts Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">{t('accounts.no_accounts')}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={openCreateDialog}>
                <Plus className="h-3 w-3 mr-1" />
                {t('accounts.add')}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">
                      {t('accounts.name')}
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">
                      {t('accounts.api_key')}
                    </th>
                    <th className="text-center text-xs font-medium text-muted-foreground p-4">
                      {t('accounts.quota')}
                    </th>
                    <th className="text-center text-xs font-medium text-muted-foreground p-4">
                      {t('accounts.used')}
                    </th>
                    <th className="text-center text-xs font-medium text-muted-foreground p-4">
                      {t('accounts.primary')}
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground p-4">
                      {t('accounts.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => {
                    const quotaPercent =
                      account.daily_quota > 0
                        ? Math.round((account.used_today / account.daily_quota) * 100)
                        : 0;
                    const isRevealed = revealedKeys.has(account.id);

                    return (
                      <tr
                        key={account.id}
                        className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4">
                          <div className="font-medium text-sm">{account.name}</div>
                          {account.notes && (
                            <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
                              {account.notes}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                              {isRevealed ? account.api_key : maskApiKey(account.api_key)}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => toggleRevealKey(account.id)}
                            >
                              {isRevealed ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-sm font-medium">{account.daily_quota}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`text-sm font-medium ${
                              quotaPercent >= 90
                                ? 'text-red-600'
                                : quotaPercent >= 70
                                  ? 'text-amber-600'
                                  : 'text-green-600'
                            }`}
                          >
                            {account.used_today}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            ({quotaPercent}%)
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {account.is_primary ? (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]">
                              <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                              {t('accounts.primary')}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(account)}
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              {t('accounts.edit')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeletingId(account.id);
                                setDeleteConfirmOpen(true);
                              }}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              {t('accounts.delete')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? locale === 'cn'
                  ? '编辑账户'
                  : 'Edit Account'
                : locale === 'cn'
                  ? '添加账户'
                  : 'Add Account'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? locale === 'cn'
                  ? '修改 API 账户信息'
                  : 'Update API account details'
                : locale === 'cn'
                  ? '添加新的 KIE.AI API 账户'
                  : 'Add a new KIE.AI API account'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('accounts.name')}</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={locale === 'cn' ? '例如：主账户' : 'e.g., Primary Account'}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('accounts.api_key')}</label>
              <Input
                type="password"
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                placeholder="kie-xxxxxxxxxxxx"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('accounts.quota')}</label>
              <Input
                type="number"
                min={1}
                value={form.dailyQuota}
                onChange={(e) =>
                  setForm({ ...form, dailyQuota: parseInt(e.target.value) || 50 })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === 'cn' ? '备注' : 'Notes'}
              </label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={locale === 'cn' ? '可选备注' : 'Optional notes'}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={form.isPrimary}
                onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="isPrimary" className="text-sm font-medium cursor-pointer">
                {locale === 'cn' ? '设为主要账户' : 'Set as primary account'}
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('common.save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locale === 'cn' ? '确认删除' : 'Confirm Delete'}
            </DialogTitle>
            <DialogDescription>
              {locale === 'cn'
                ? '此操作无法撤销。确定要删除此账户吗？'
                : 'This action cannot be undone. Are you sure you want to delete this account?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDeletingId(null);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('common.delete')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

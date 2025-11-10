import React from 'react';
import { Link, Navigate, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuth0 } from '@auth0/auth0-react';
import { CreditCard, Plus, X } from 'lucide-react';
import { useApiMutation, useApiQuery, useCurrentUser } from '@/integrations/api';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Account = {
  id: string;
  userId: string;
  accountType: string;
  value: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

export const Route = createFileRoute('/accounts')({
  component: AccountsPage,
});

function AccountsPage() {
  const { isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();
  const me = useCurrentUser();
  const accountsQ = useApiQuery<Array<Account>>(['accounts', 'me'], '/accounts/me');

  const addAccount = useApiMutation<
    { userId: string; accountType: string; value: number; currency: string },
    Account
  >({
    path: '/accounts',
    method: 'POST',
    invalidateKeys: [['accounts', 'me']],
  });

  const deleteAccount = useApiMutation<{ id: string }, void>({
    endpoint: (v) => ({ path: `/accounts/${v.id}`, method: 'DELETE' }),
    invalidateKeys: [['accounts', 'me']],
  });

  const [showForm, setShowForm] = React.useState(false);
  const [accountType, setAccountType] = React.useState<'checking' | 'savings' | 'credit'>('checking');
  const [currency, setCurrency] = React.useState<'USD' | 'EUR' | 'GBP'>('USD');
  const [value, setValue] = React.useState<string>('0');
  const [selected, setSelected] = React.useState<null | {
    id: string;
    accountType: string;
    value: number;
    currency: string;
  }>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!me.data?.id) return;
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    await addAccount.mutateAsync({
      userId: me.data.id,
      accountType,
      currency,
      value: parsed,
    });
    setShowForm(false);
    setValue('0');
    setAccountType('checking');
    setCurrency('USD');
  }

  async function onDelete(id: string) {
    try {
      const ok = window.confirm('Delete this account?');
      if (!ok) return;
      await deleteAccount.mutateAsync({ id });
    } catch (err) {
      // no-op; surfaced via invalidation/notifications if desired
    }
  }

  if (isLoading || accountsQ.showLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading accounts...€¦</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  const accounts = accountsQ.data ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Your Accounts
          </h1>
          <div className="flex gap-2">
            <Button onClick={() => setShowForm((s) => !s)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Account
            </Button>
            <Link to="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add a New Account</CardTitle>
              <CardDescription>Provide details for your new account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-4 items-end">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Type</label>
                  <select
                    className="w-full border rounded-md h-10 px-3"
                    value={accountType}
                    onChange={(e) =>
                      setAccountType(
                        e.target.value as 'checking' | 'savings' | 'credit',
                      )
                    }
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Currency</label>
                  <select
                    className="w-full border rounded-md h-10 px-3"
                    value={currency}
                    onChange={(e) =>
                      setCurrency(e.target.value as 'USD' | 'EUR' | 'GBP')
                    }
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Initial Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded-md h-10 px-3"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2 md:col-span-4 mt-2">
                  <Button type="submit" disabled={addAccount.isPending}>
                    {addAccount.isPending ? 'Saving...€¦' : 'Save Account'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    disabled={addAccount.isPending}
                  >
                    Cancel
                  </Button>
                </div>
                {addAccount.error && (
                  <div className="md:col-span-4 text-sm text-red-600">
                    {(addAccount.error).message}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        )}
        {accounts.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Accounts Found</CardTitle>
              <CardDescription>
                You donâ€™t have any accounts yet.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {accounts.map((acc) => (
              <Card
                key={acc.id}
                className="border-2 hover:shadow transition-shadow cursor-pointer"
                onClick={() => setSelected({ id: acc.id, accountType: acc.accountType, value: acc.value, currency: acc.currency })}
              >
                <CardHeader>
                  <CardAction>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete account"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void onDelete(acc.id);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </CardAction>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    {acc.accountType.toUpperCase()}
                  </CardTitle>
                  <CardDescription>
                    Balance: {formatCurrency(acc.value, acc.currency)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500">Currency: {acc.currency}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      {selected && (
        <AccountTransactionsModal account={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function formatCurrency(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)} ${currency}`;
  }
}

type Tx = {
  id: string;
  accountId: string;
  type: string;
  amount: number;
  vendor: string;
  createdAt: string;
};

function AccountTransactionsModal({
  account,
  onClose,
}: {
  account: { id: string; accountType: string; value: number; currency: string };
  onClose: () => void;
}) {
  const txQ = useApiQuery<Array<Tx>>(
    ['accounts', account.id, 'transactions'],
    `/accounts/${account.id}/transactions`,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-start justify-between p-4 border-b">
          <div>
            <div className="text-sm text-gray-500">Account</div>
            <div className="text-lg font-semibold">{account.accountType.toUpperCase()}</div>
            <div className="text-sm text-gray-600">
              Current Total: {formatCurrency(account.value, account.currency)}
            </div>
          </div>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {txQ.showLoading ? (
            <div className="py-12 text-center text-gray-600">Loading transactions…</div>
          ) : txQ.error ? (
            <div className="py-12 text-center text-red-600">
              {(txQ.error as Error).message || 'Failed to load transactions.'}
            </div>
          ) : (txQ.data ?? []).length === 0 ? (
            <div className="py-12 text-center text-gray-600">No transactions yet.</div>
          ) : (
            <div className="divide-y">
              {(txQ.data ?? []).map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium text-gray-900">{t.vendor}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(t.createdAt).toLocaleString()} · {t.type}
                    </div>
                  </div>
                  <div className={`font-semibold ${t.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                    {t.type === 'credit' ? '+' : '-'}
                    {formatCurrency(Math.abs(t.amount), account.currency)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

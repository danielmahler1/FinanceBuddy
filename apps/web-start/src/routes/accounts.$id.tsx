import React from 'react';
import { Link, Navigate, createFileRoute } from '@tanstack/react-router';
import { useAuth0 } from '@auth0/auth0-react';
import { ArrowLeft, CreditCard, ListOrdered } from 'lucide-react';
import { useApiQuery } from '@/integrations/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TransactionActions } from '@/components/TransactionActions';

type Transaction = {
  id: string;
  accountId: string;
  type: string;
  amount: number;
  vendor: string;
  createdAt: string;
};

export const Route = createFileRoute('/accounts/$id')({
  component: AccountTransactionsPage,
});

function AccountTransactionsPage() {
  const { isAuthenticated, isLoading } = useAuth0();
  const { id } = Route.useParams();
  const txQ = useApiQuery<Array<Transaction>>(
    ['accounts', id, 'transactions'],
    `/accounts/${id}/transactions`,
  );

  if (txQ.showLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated && !isLoading) return <Navigate to="/" />;

  const txs = txQ.data ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-blue-600" />
            Account Transactions
          </h1>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/accounts">
              <ArrowLeft className="w-4 h-4" /> Back to Accounts
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {txQ.error ? (
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>Failed to load</CardTitle>
              <CardDescription>
                {(txQ.error as Error).message ?? 'Unable to fetch transactions.'}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : txs.length === 0 ? (
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>No Transactions</CardTitle>
              <CardDescription>
                This account has no transactions yet.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> Recent Transactions
              </CardTitle>
              <CardDescription>Sorted by newest first</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {txs.map((t) => (
                  <div key={t.id} className="flex items-start justify-between py-3 gap-4">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{t.vendor}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(t.createdAt).toLocaleString()} · {t.type}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`font-semibold ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {t.amount >= 0 ? '+' : '-'}${Math.abs(t.amount).toFixed(2)}
                      </div>
                      <TransactionActions transaction={t} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

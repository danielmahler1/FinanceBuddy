import { Link, Navigate, createFileRoute } from '@tanstack/react-router';
import { useAuth0 } from '@auth0/auth0-react';
import { ArrowLeft, Calendar, DollarSign, Edit, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApiMutation, useApiQuery } from '@/integrations/api';

export const Route = createFileRoute('/recurring-charges')({
  component: RecurringChargesPage,
});

type RecurringCharge = {
  id: string;
  accountId: string;
  type: string;
  amount: number;
  vendor: string;
  interval: string;
  dayOfMonth: number;
  monthOfYear?: number;
  startDate: string;
  endDate?: string;
  lastProcessedDate?: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  account: {
    id: string;
    accountType: string;
    currency: string;
    value: number;
  };
};

const INTERVAL_LABELS: Record<string, string> = {
  daily: 'Daily',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function RecurringChargesPage() {
  const { isAuthenticated, isLoading } = useAuth0();
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [editingCharge, setEditingCharge] = useState<RecurringCharge | null>(null);
  const [editEndDate, setEditEndDate] = useState('');

  // Fetch recurring charges
  const chargesQ = useApiQuery<Array<RecurringCharge>>(
    ['recurring-charges'],
    '/recurring-charges'
  );
  const charges = chargesQ.data ?? [];

  // Delete mutation
  const deleteMutation = useApiMutation<{ id: string }, void>({
    endpoint: (vars) => ({ path: `/recurring-charges/${vars.id}`, method: 'DELETE' }),
    invalidateKeys: [['recurring-charges']],
  });

  // Update mutation (using endpoint function for dynamic path and body)
  const updateMutation = useApiMutation<{ id: string; endDate?: string }, void>({
    endpoint: (vars) => {
      const { id, ...updateData } = vars;
      return {
        path: `/recurring-charges/${id}`,
        method: 'PUT',
        body: updateData,
      };
    },
    invalidateKeys: [['recurring-charges']],
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this recurring charge?')) {
      try {
        await deleteMutation.mutateAsync({ id });
        showNotification('success', 'Recurring charge deleted successfully');
      } catch (error) {
        showNotification('error', 'Failed to delete recurring charge');
      }
    }
  };

  const handleEdit = (charge: RecurringCharge) => {
    setEditingCharge(charge);
    // Extract just the date part (YYYY-MM-DD) without timezone conversion
    const endDateStr = charge.endDate ? charge.endDate.split('T')[0] : '';
    setEditEndDate(endDateStr || '');
  };

  const handleSaveEdit = async () => {
    if (!editingCharge) return;
    try {
      await updateMutation.mutateAsync({
        id: editingCharge.id,
        // Create date at midnight UTC to avoid timezone issues
        endDate: editEndDate ? `${editEndDate}T00:00:00.000Z` : undefined,
      });
      showNotification('success', 'End date updated successfully');
      setEditingCharge(null);
    } catch (error) {
      showNotification('error', 'Failed to update end date');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div
            className={`rounded-lg shadow-lg p-4 ${
              notification.type === 'success'
                ? 'bg-green-50 border-2 border-green-500'
                : 'bg-red-50 border-2 border-red-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <p
                className={`font-semibold ${
                  notification.type === 'success' ? 'text-green-900' : 'text-red-900'
                }`}
              >
                {notification.message}
              </p>
              <button onClick={() => setNotification(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Recurring Charges</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your recurring income and expenses
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Charges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {charges.filter((c) => c.status).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  $
                  {charges
                    .filter((c) => c.status && c.type === 'expense' && c.interval === 'monthly')
                    .reduce((sum, c) => sum + Math.abs(c.amount), 0)
                    .toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  $
                  {charges
                    .filter((c) => c.status && c.type === 'income' && c.interval === 'monthly')
                    .reduce((sum, c) => sum + Math.abs(c.amount), 0)
                    .toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charges List */}
          {chargesQ.showLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading charges...</p>
            </div>
          ) : charges.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Recurring Charges Yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Set up recurring charges when creating transactions
                  </p>
                  <Link to="/transactions">
                    <Button className="gap-2">
                      <DollarSign className="w-4 h-4" />
                      Add Transaction
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {charges.map((charge) => {
                // Check if charge is truly active (status true AND not past end date)
                const now = new Date();
                const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
                const hasEnded = charge.endDate && new Date(charge.endDate) < today;
                const isActive = charge.status && !hasEnded;

                return (
                  <Card key={charge.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {charge.vendor}
                          </h3>
                          <div className="flex items-center gap-3 mb-2">
                            <Badge
                              className={
                                charge.type === 'income'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }
                            >
                              {charge.type === 'income' ? 'Income' : 'Expense'}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={isActive ? '' : 'opacity-50'}
                            >
                              {isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          <Badge variant="outline" className="gap-1">
                            <Calendar className="w-3 h-3" />
                            {INTERVAL_LABELS[charge.interval] || charge.interval}
                          </Badge>
                        </div>
                        <div className="flex items-baseline gap-3">
                          <span className="text-3xl font-bold text-gray-900">
                            ${Math.abs(charge.amount).toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-500">
                            / {INTERVAL_LABELS[charge.interval]?.toLowerCase() || charge.interval}
                          </span>
                        </div>
                        <div className="mt-3 text-sm text-gray-600">
                          <p>
                            Account: {charge.account.accountType.toUpperCase()} (
                            {charge.account.currency})
                          </p>
                          {charge.interval === 'monthly' && (
                            <p>
                              Charges on: Day {charge.dayOfMonth} of each month
                            </p>
                          )}
                          {charge.interval === 'yearly' && charge.monthOfYear && (
                            <p>
                              Charges on: {MONTH_NAMES[charge.monthOfYear - 1]} {charge.dayOfMonth} each year
                            </p>
                          )}
                          {charge.interval === 'daily' && (
                            <p>Charges: Every day</p>
                          )}
                          <p>
                            Started:{' '}
                            {new Date(charge.startDate).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                          </p>
                          {charge.lastProcessedDate && (
                            <p>
                              Last Processed:{' '}
                              {new Date(charge.lastProcessedDate).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                            </p>
                          )}
                          {charge.endDate && (
                            <p>
                              Ends:{' '}
                              {new Date(charge.endDate).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(charge)}
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(charge.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {editingCharge && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Edit Recurring Charge</h2>
              <button onClick={() => setEditingCharge(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{editingCharge.vendor}</h3>
                <p className="text-sm text-gray-600">
                  ${Math.abs(editingCharge.amount).toFixed(2)} / {INTERVAL_LABELS[editingCharge.interval]?.toLowerCase()}
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  End Date (Optional - leave empty for no end date)
                </label>
                <input
                  type="date"
                  className="w-full border rounded-md h-10 px-3"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingCharge(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

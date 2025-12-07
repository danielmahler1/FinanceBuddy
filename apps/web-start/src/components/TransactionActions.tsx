import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useApiMutation, useApiQuery } from '@/integrations/api';

type Transaction = {
  id: string;
  accountId: string;
  type: string;
  amount: number;
  vendor: string;
  createdAt: string;
};

type Account = {
  id: string;
  accountType: string;
  currency: string;
  value: number;
};

type UpdateTxDto = {
  accountId?: string;
  type?: string;
  amount?: number;
  vendor?: string;
};

interface TransactionActionsProps {
  transaction: Transaction;
  onSuccess?: () => void;
}

export function TransactionActions({ transaction, onSuccess }: TransactionActionsProps) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditOpen(true)}
          className="gap-1"
        >
          <Edit2 className="w-3 h-3" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDeleteOpen(true)}
          className="gap-1 text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </Button>
      </div>

      <EditTransactionDialog
        transaction={transaction}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={onSuccess}
      />

      <DeleteTransactionDialog
        transaction={transaction}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={onSuccess}
      />
    </>
  );
}

interface EditTransactionDialogProps {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function EditTransactionDialog({
  transaction,
  open,
  onOpenChange,
  onSuccess,
}: EditTransactionDialogProps) {
  const accountsQ = useApiQuery<Array<Account>>(['accounts', 'me'], '/accounts/me');
  const accounts = accountsQ.data ?? [];

  const updateTx = useApiMutation<UpdateTxDto, unknown>({
    endpoint: () => ({
      path: `/transactions/${transaction.id}`,
      method: 'PUT',
    }),
    invalidateKeys: [
      ['transactions'],
      ['accounts', 'me'],
      ['accounts', 'me', 'summary'],
      ['accounts', transaction.accountId, 'transactions'],
    ],
  });

  // Convert amount back to positive for display
  const absAmount = Math.abs(transaction.amount);
  const txType = transaction.amount >= 0 ? 'income' : 'expense';

  const [form, setForm] = React.useState({
    accountId: transaction.accountId,
    type: txType,
    amount: String(absAmount),
    vendor: transaction.vendor,
  });

  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setForm({
        accountId: transaction.accountId,
        type: txType,
        amount: String(absAmount),
        vendor: transaction.vendor,
      });
      setError(null);
    }
  }, [open, transaction, absAmount, txType]);

  const onChange = (patch: Partial<typeof form>) =>
    setForm((f) => ({ ...f, ...patch }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      if (!form.accountId) throw new Error('Please choose an account');
      if (!form.amount || Number.isNaN(Number(form.amount))) {
        throw new Error('Enter a valid amount');
      }

      const numericAmount = Number(form.amount);
      const signedAmount =
        form.type === 'income' ? Math.abs(numericAmount) : -Math.abs(numericAmount);

      await updateTx.mutateAsync({
        accountId: form.accountId,
        type: form.type,
        amount: signedAmount,
        vendor: form.vendor,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update transaction');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Update the transaction details below
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account
            </label>
            <select
              className="w-full border rounded-md h-10 px-3"
              value={form.accountId}
              onChange={(e) => onChange({ accountId: e.target.value })}
            >
              <option value="">Select account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountType.toUpperCase()} {a.currency} ${a.value.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              className="w-full border rounded-md h-10 px-3"
              value={form.type}
              onChange={(e) =>
                onChange({ type: e.target.value as 'income' | 'expense' })
              }
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              className="w-full border rounded-md h-10 px-3"
              value={form.amount}
              onChange={(e) => onChange({ amount: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor
            </label>
            <input
              type="text"
              className="w-full border rounded-md h-10 px-3"
              value={form.vendor}
              onChange={(e) => onChange({ vendor: e.target.value })}
              placeholder="e.g., Grocery Store"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateTx.isPending}>
              {updateTx.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteTransactionDialogProps {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function DeleteTransactionDialog({
  transaction,
  open,
  onOpenChange,
  onSuccess,
}: DeleteTransactionDialogProps) {
  const deleteTx = useApiMutation<Record<string, never>, unknown>({
    endpoint: () => ({
      path: `/transactions/${transaction.id}`,
      method: 'DELETE',
    }),
    invalidateKeys: [
      ['transactions'],
      ['accounts', 'me'],
      ['accounts', 'me', 'summary'],
      ['accounts', transaction.accountId, 'transactions'],
    ],
  });

  const [error, setError] = React.useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    try {
      await deleteTx.mutateAsync({});
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete transaction');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Transaction</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this transaction? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-gray-50 rounded-md p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Vendor:</span>
              <span className="text-sm font-medium">{transaction.vendor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Amount:</span>
              <span
                className={`text-sm font-semibold ${
                  transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {transaction.amount >= 0 ? '+' : '-'}$
                {Math.abs(transaction.amount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Date:</span>
              <span className="text-sm">
                {new Date(transaction.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteTx.isPending}
          >
            {deleteTx.isPending ? 'Deleting...' : 'Delete Transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

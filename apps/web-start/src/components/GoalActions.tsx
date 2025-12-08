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
import { useApiMutation } from '@/integrations/api';

type Goal = {
  id: string;
  userId: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  status: string;
  category?: string;
  priority?: string;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
};

type UpdateGoalDto = {
  name?: string;
  description?: string;
  targetAmount?: number;
  currentAmount?: number;
  status?: string;
  category?: string;
  priority?: string;
  targetDate?: string;
};

const GOAL_CATEGORIES = [
  { value: 'car', label: 'Car' },
  { value: 'house', label: 'House' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'education', label: 'Education' },
  { value: 'emergency', label: 'Emergency Fund' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'other', label: 'Other' },
];

const PRIORITY_LEVELS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

interface GoalActionsProps {
  goal: Goal;
  onSuccess?: () => void;
}

export function GoalActions({ goal, onSuccess }: GoalActionsProps) {
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

      <EditGoalDialog
        goal={goal}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={onSuccess}
      />

      <DeleteGoalDialog
        goal={goal}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={onSuccess}
      />
    </>
  );
}

interface EditGoalDialogProps {
  goal: Goal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function EditGoalDialog({
  goal,
  open,
  onOpenChange,
  onSuccess,
}: EditGoalDialogProps) {
  const updateGoal = useApiMutation<UpdateGoalDto, unknown>({
    endpoint: () => ({
      path: `/goals/${goal.id}`,
      method: 'PUT',
    }),
    invalidateKeys: [['goals']],
  });

  const [form, setForm] = React.useState({
    name: goal.name,
    description: goal.description || '',
    targetAmount: String(goal.targetAmount),
    currentAmount: String(goal.currentAmount),
    category: goal.category || '',
    priority: goal.priority || 'medium',
    targetDate: goal.targetDate
      ? new Date(goal.targetDate).toISOString().split('T')[0]
      : '',
  });

  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setForm({
        name: goal.name,
        description: goal.description || '',
        targetAmount: String(goal.targetAmount),
        currentAmount: String(goal.currentAmount),
        category: goal.category || '',
        priority: goal.priority || 'medium',
        targetDate: goal.targetDate
          ? new Date(goal.targetDate).toISOString().split('T')[0]
          : '',
      });
      setError(null);
    }
  }, [open, goal]);

  const onChange = (patch: Partial<typeof form>) =>
    setForm((f) => ({ ...f, ...patch }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      if (!form.name?.trim()) throw new Error('Please enter a goal name');
      const targetNum = Number(form.targetAmount);
      if (!form.targetAmount || isNaN(targetNum) || targetNum <= 0) {
        throw new Error('Please enter a valid target amount');
      }

      await updateGoal.mutateAsync({
        name: form.name,
        description: form.description || undefined,
        targetAmount: targetNum,
        currentAmount: Number(form.currentAmount) || 0,
        category: form.category || undefined,
        priority: form.priority,
        targetDate: form.targetDate || undefined,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update goal');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Goal</DialogTitle>
          <DialogDescription>
            Update the goal details below
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goal Name
            </label>
            <input
              type="text"
              className="w-full border rounded-md h-10 px-3"
              value={form.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="e.g., Save for vacation"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full border rounded-md px-3 py-2"
              rows={3}
              value={form.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Optional description"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Amount
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full border rounded-md h-10 px-3"
                value={form.targetAmount}
                onChange={(e) => onChange({ targetAmount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Amount
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full border rounded-md h-10 px-3"
                value={form.currentAmount}
                onChange={(e) => onChange({ currentAmount: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {GOAL_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => onChange({ category: cat.value })}
                  className={`p-3 border-2 rounded-lg text-center transition-all text-sm ${
                    form.category === cat.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                className="w-full border rounded-md h-10 px-3"
                value={form.priority}
                onChange={(e) => onChange({ priority: e.target.value })}
              >
                {PRIORITY_LEVELS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Date
              </label>
              <input
                type="date"
                className="w-full border rounded-md h-10 px-3"
                value={form.targetDate}
                onChange={(e) => onChange({ targetDate: e.target.value })}
              />
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
            <Button type="submit" disabled={updateGoal.isPending}>
              {updateGoal.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteGoalDialogProps {
  goal: Goal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function DeleteGoalDialog({
  goal,
  open,
  onOpenChange,
  onSuccess,
}: DeleteGoalDialogProps) {
  const deleteGoal = useApiMutation<Record<string, never>, unknown>({
    endpoint: () => ({
      path: `/goals/${goal.id}`,
      method: 'DELETE',
    }),
    invalidateKeys: [['goals']],
  });

  const [error, setError] = React.useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    try {
      await deleteGoal.mutateAsync({});
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete goal');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Goal</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this goal? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-gray-50 rounded-md p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Name:</span>
              <span className="text-sm font-medium">{goal.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Target:</span>
              <span className="text-sm font-semibold">
                ${goal.targetAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Current:</span>
              <span className="text-sm font-semibold">
                ${goal.currentAmount.toLocaleString()}
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
            disabled={deleteGoal.isPending}
          >
            {deleteGoal.isPending ? 'Deleting...' : 'Delete Goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



import { Link, Navigate, createFileRoute } from '@tanstack/react-router';
import { useAuth0 } from '@auth0/auth0-react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  DollarSign,
  Edit,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApiMutation, useApiQuery } from '@/integrations/api';

export const Route = createFileRoute('/goals')({
  component: GoalsPage,
});

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

const GOAL_CATEGORIES = [
  { value: 'car', label: 'Car', icon: '🚗' },
  { value: 'house', label: 'House', icon: '🏠' },
  { value: 'vacation', label: 'Vacation', icon: '✈️' },
  { value: 'education', label: 'Education', icon: '🎓' },
  { value: 'emergency', label: 'Emergency Fund', icon: '💰' },
  { value: 'wedding', label: 'Wedding', icon: '💍' },
  { value: 'other', label: 'Other', icon: '🎯' },
];

const PRIORITY_LEVELS = [
  { value: 'high', label: 'High', color: 'text-red-600 bg-red-100' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600 bg-yellow-100' },
  { value: 'low', label: 'Low', color: 'text-blue-600 bg-blue-100' },
];

function GoalsPage() {
  const { isAuthenticated, isLoading } = useAuth0();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Fetch goals
  const goalsQ = useApiQuery<Array<Goal>>(['goals'], '/goals');
  const goals = goalsQ.data ?? [];

  // Mutations
  const createMutation = useApiMutation<Partial<Goal>, Goal>({
    path: '/goals',
    method: 'POST',
    invalidateKeys: [['goals']],
  });

  const updateMutation = useApiMutation<Partial<Goal>, Goal>({
    endpoint: () => ({ path: `/goals/${selectedGoal?.id}`, method: 'PUT' }),
    invalidateKeys: [['goals']],
  });

  const deleteMutation = useApiMutation<never, void>({
    endpoint: () => ({ path: `/goals/${selectedGoal?.id}`, method: 'DELETE' }),
    invalidateKeys: [['goals']],
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
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
              <div className="flex items-center gap-3">
                {notification.type === 'success' ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <X className="w-6 h-6 text-red-600" />
                )}
                <p
                  className={`font-semibold ${
                    notification.type === 'success' ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {notification.message}
                </p>
              </div>
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
                <h1 className="text-2xl font-bold text-gray-900">Financial Goals</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Track your savings progress and achieve your dreams
                </p>
              </div>
            </div>
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Goal
            </Button>
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
                <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
                <Target className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{goals.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
                <DollarSign className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${goals.reduce((sum, g) => sum + g.currentAmount, 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Target Amount</CardTitle>
                <TrendingUp className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${goals.reduce((sum, g) => sum + g.targetAmount, 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Goals List */}
          {goalsQ.showLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading goals...</p>
            </div>
          ) : goals.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Goals Yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Start saving for your dreams by creating your first goal!
                  </p>
                  <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Your First Goal
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {goals.map((goal) => {
                const percentage = Math.min(
                  100,
                  Math.round((goal.currentAmount / goal.targetAmount) * 100)
                );
                const category = GOAL_CATEGORIES.find((c) => c.value === goal.category);
                const priority = PRIORITY_LEVELS.find((p) => p.value === goal.priority);

                return (
                  <Card key={goal.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{category?.icon || '🎯'}</div>
                          <div>
                            <CardTitle className="text-xl">{goal.name}</CardTitle>
                            {goal.description && (
                              <CardDescription className="mt-1">
                                {goal.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedGoal(goal);
                              setShowEditModal(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (
                                confirm('Are you sure you want to delete this goal?')
                              ) {
                                setSelectedGoal(goal);
                                deleteMutation
                                  .mutateAsync({} as never)
                                  .then(() => {
                                    showNotification('success', 'Goal deleted successfully');
                                    setSelectedGoal(null);
                                  })
                                  .catch(() => {
                                    showNotification('error', 'Failed to delete goal');
                                  });
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700">Progress</span>
                          <span className="font-bold text-gray-900">{percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-linear-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>${goal.currentAmount.toFixed(2)}</span>
                          <span>${goal.targetAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Meta Information */}
                      <div className="flex flex-wrap gap-2">
                        {priority && (
                          <Badge className={priority.color}>{priority.label}</Badge>
                        )}
                        {goal.targetDate && (
                          <Badge variant="outline" className="gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(goal.targetDate).toLocaleDateString()}
                          </Badge>
                        )}
                        {goal.status === 'completed' && (
                          <Badge className="bg-green-100 text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>

                      {/* Contribute Button */}
                      <Button
                        onClick={() => {
                          setSelectedGoal(goal);
                          setShowContributeModal(true);
                        }}
                        className="w-full gap-2"
                        disabled={goal.status === 'completed'}
                      >
                        <DollarSign className="w-4 h-4" />
                        Add Contribution
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <GoalFormModal
          goal={showEditModal ? selectedGoal : null}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedGoal(null);
          }}
          onSubmit={async (data) => {
            try {
              if (showEditModal && selectedGoal) {
                await updateMutation.mutateAsync(data);
                showNotification('success', 'Goal updated successfully!');
              } else {
                await createMutation.mutateAsync(data);
                showNotification('success', 'Goal created successfully!');
              }
              setShowCreateModal(false);
              setShowEditModal(false);
              setSelectedGoal(null);
            } catch (error) {
              showNotification(
                'error',
                `Failed to ${showEditModal ? 'update' : 'create'} goal`
              );
            }
          }}
        />
      )}

      {/* Contribute Modal */}
      {showContributeModal && selectedGoal && (
        <ContributeModal
          goal={selectedGoal}
          onClose={() => {
            setShowContributeModal(false);
            setSelectedGoal(null);
          }}
          onSubmit={async (amount) => {
            try {
              await updateMutation.mutateAsync({
                currentAmount: selectedGoal.currentAmount + amount,
                status:
                  selectedGoal.currentAmount + amount >= selectedGoal.targetAmount
                    ? 'completed'
                    : selectedGoal.status,
              });
              showNotification('success', `Added $${amount.toFixed(2)} to your goal!`);
              setShowContributeModal(false);
              setSelectedGoal(null);
            } catch (error) {
              showNotification('error', 'Failed to add contribution');
            }
          }}
        />
      )}
    </div>
  );
}

// Goal Form Modal Component
function GoalFormModal({
  goal,
  onClose,
  onSubmit,
}: {
  goal: Goal | null;
  onClose: () => void;
  onSubmit: (data: Partial<Goal>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    name: goal?.name || '',
    description: goal?.description || '',
    targetAmount: goal?.targetAmount !== undefined ? String(goal.targetAmount) : '',
    currentAmount: goal?.currentAmount !== undefined ? String(goal.currentAmount) : '',
    category: goal?.category || '',
    priority: goal?.priority || 'medium',
    targetDate: goal?.targetDate
      ? new Date(goal.targetDate).toISOString().split('T')[0]
      : '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate numbers
    const targetNum = Number(formData.targetAmount);
    if (!formData.targetAmount || isNaN(targetNum) || targetNum <= 0) {
      alert('Please enter a valid target amount');
      return;
    }

    setLoading(true);
    await onSubmit({
      ...formData,
      targetAmount: targetNum,
      currentAmount: Number(formData.currentAmount) || 0,
      status: goal?.status || 'active',
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full my-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {goal ? 'Edit Goal' : 'Create New Goal'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Goal Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goal Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., New Car, Vacation to Japan"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add details about your goal..."
              rows={3}
            />
          </div>

          {/* Target Amount and Initial Contribution */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Amount *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.targetAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAmount: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            {!goal && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Contribution
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.currentAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentAmount: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {GOAL_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  className={`p-3 border-2 rounded-lg text-center transition-all ${
                    formData.category === cat.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <div className="text-xs font-medium">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Priority and Target Date */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {PRIORITY_LEVELS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) =>
                    setFormData({ ...formData, targetDate: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : goal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Contribute Modal Component
function ContributeModal({
  goal,
  onClose,
  onSubmit,
}: {
  goal: Goal;
  onClose: () => void;
  onSubmit: (amount: number) => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setLoading(true);
    await onSubmit(numAmount);
    setLoading(false);
  };

  const remaining = goal.targetAmount - goal.currentAmount;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Add Contribution</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">Contributing to</p>
              <p className="text-xl font-bold text-gray-900">{goal.name}</p>
              <p className="text-sm text-gray-600 mt-2">
                ${remaining.toFixed(2)} remaining to reach goal
              </p>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contribution Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                autoFocus
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[10, 25, 50, 100].map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ${quickAmount}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !amount} className="flex-1">
              {loading ? 'Adding...' : 'Add Contribution'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

